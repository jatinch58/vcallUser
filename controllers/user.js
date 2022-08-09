const Joi = require("joi");
const axios = require("axios");
const userdb = require("../models/profile");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const refreshTokendb = require("../models/refreshToken");
const hostFormdb = require("../models/hostForm");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  Bucket: process.env.BUCKET_NAME,
});
//=========================================== user login ===========================================//
exports.sendOTP = (req, res) => {
  try {
    const { body } = req;
    const phoneSchema = Joi.object()
      .keys({
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
      })
      .required();
    const result = phoneSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    axios
      .get(process.env.SMS_API + req.body.phone + "/AUTOGEN")
      .then((response) => {
        return res.status(200).send(response.data);
      })
      .catch((er) => {
        return res.status(500).send({ message: er.name });
      });
  } catch (er) {
    return res.status(500).send({ message: er.name });
  }
};
///========================================== verify otp ===========================================//
exports.verifyOTP = async (req, res) => {
  try {
    const { body } = req;
    const otpSchema = Joi.object()
      .keys({
        details: Joi.string().required(),
        otp: Joi.number().max(999999).required(),
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
      })
      .required();
    const result = otpSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    axios
      .get(
        process.env.SMS_API + "VERIFY/" + req.body.details + "/" + req.body.otp
      )
      .then(async (response) => {
        if (response.data.Details === "OTP Matched") {
          const myRefreshToken = uuidv4();
          const isAlreadyRegistered = await userdb.findOne({
            phone: req.body.phone,
          });
          if (isAlreadyRegistered) {
            const p = isAlreadyRegistered._id.toString();
            await refreshTokendb.findOneAndUpdate(
              { userId: p },
              { refreshToken: myRefreshToken },
              { upsert: true }
            );
            const token = jwt.sign({ _id: p }, process.env.TOKEN_PASSWORD, {
              expiresIn: "24h",
            });
            return res.status(200).send({
              data: isAlreadyRegistered,
              token: token,
              refreshToken: myRefreshToken,
            });
          }
          const createUser = new userdb({
            phone: req.body.phone,
          });
          createUser
            .save()
            .then(async (a) => {
              const p = a._id.toString();
              await refreshTokendb.findOneAndUpdate(
                { userId: p },
                { refreshToken: myRefreshToken },
                { upsert: true }
              );
              const token = jwt.sign({ _id: p }, process.env.TOKEN_PASSWORD, {
                expiresIn: "24h",
              });
              return res
                .status(200)
                .send({ data: a, token: token, refreshToken: myRefreshToken });
            })
            .catch(() => {
              return res
                .status(500)
                .send({ message: "Something bad happened" });
            });
        } else if (response.data.Details === "OTP Expired") {
          return res.status(403).send({ message: "OTP Expired" });
        } else {
          return res.status(500).send({ message: "Something went wrong" });
        }
      })
      .catch((e) => {
        return res.status(400).send({ e: e.name });
      });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//============================================== refresh token =====================================//
exports.refreshToken = async (req, res) => {
  try {
    const myRefreshToken = uuidv4();
    const refresh = await refreshTokendb.findOneAndUpdate(
      {
        userId: req.user._id,
        refreshToken: req.params.refreshToken,
      },
      {
        refreshToken: myRefreshToken,
      }
    );
    if (!refresh) {
      return res.status(400).send({ message: "Invalid refresh token" });
    }
    const token = jwt.sign({ _id: req.user._id }, process.env.TOKEN_PASSWORD, {
      expiresIn: "24h",
    });
    return res.status(200).send({ refreshToken: myRefreshToken, token: token });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//============================================= get profile ========================================//
exports.getProfile = async (req, res) => {
  try {
    const userProfile = await userdb.findOne({ userId: req.user._id });
    if (!userProfile) {
      return res.status(404).send({ message: "Nothing found" });
    }
    return res.status(200).send({ profile: userProfile });
  } catch (e) {
    res.status(500).send({ message: e.name });
  }
};
//========================================== update profile ========================================//
exports.updateProfile = async (req, res) => {
  try {
    let date = new Date();
    date =
      date.getMonth() +
      1 +
      "-" +
      date.getDate() +
      "-" +
      (date.getFullYear() - 18);
    const { body } = req;
    const profileSchema = Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string(),
        gender: Joi.string().valid("male", "female", "other").required(),
        dob: Joi.date().less(date).required(),
        city: Joi.string().required(),
        aboutMe: Joi.string(),
      })
      .required();
    const isValidate = profileSchema.validate(body);
    if (isValidate.error) {
      return res
        .status(400)
        .send({ message: isValidate.error.details[0].message });
    }
    const result = await userdb.findByIdAndUpdate(req.user._id, body);
    if (result) {
      return res.status(200).send({ message: "Updated successfully" });
    }
    return res.status(500).send({ message: "Something bad happened" });
  } catch (e) {
    res.status(500).send({ message: e.name });
  }
};
//================================= upload profile picture =========================================//
exports.uploadProfilePicture = async (req, res) => {
  try {
    const fileName = req.file.originalname.split(".");
    const mimeType = fileName[fileName.length - 1];
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uuidv4()}.${mimeType}`,
      Body: req.file.buffer,
    };
    s3.upload(params, async (error, data) => {
      if (error) {
        return res.status(500).send(error);
      } else {
        const result = await userdb.findByIdAndUpdate(req.user._id, {
          profilePicture: data.Location,
        });
        if (result) {
          return res.status(200).send({ message: "Uploading done" });
        }
        return res.status(500).send({ message: "Something bad happened" });
      }
    });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//=================================== update profile picture =======================================//
exports.updateProfilePicture = async (req, res) => {
  try {
    let fileName = req.file.originalname.split(".");
    const mimeType = fileName[fileName.length - 1];
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uuidv4()}.${mimeType}`,
      Body: req.file.buffer,
    };
    s3.upload(params, async (error, dataResult) => {
      if (error) {
        return res.status(500).send(error);
      }
      let key = req.body.profileUrl;
      if (key) {
        key = key.split("/");
        key = key[key.length - 1];
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        };
        const s3delete = function (params) {
          return new Promise((resolve, reject) => {
            s3.createBucket(
              {
                Bucket: params.Bucket,
              },
              function () {
                s3.deleteObject(params, async function (err, data) {
                  if (err) return res.status(500).send({ message: err });
                  const result = await userdb.findByIdAndUpdate(req.user._id, {
                    profilePicture: dataResult.Location,
                  });
                  if (result) {
                    return res.status(200).send({
                      message: "Profile picture updated successfully",
                    });
                  }
                  return res
                    .status(500)
                    .send({ message: "Something bad happened" });
                });
              }
            );
          });
        };
        s3delete(params);
      } else {
        return res
          .status(400)
          .send({ message: "Please provide profile picture url" });
      }
    });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//=================================== request to be host ===========================================//
exports.requestHostUsingAadhaar = async (req, res) => {
  try {
    const { body } = req;
    let date = new Date();
    date =
      date.getMonth() +
      1 +
      "-" +
      date.getDate() +
      "-" +
      (date.getFullYear() - 18);

    const requestSchema = Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dob: Joi.date().less(date).required(),
        email: Joi.string().email().required(),
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
        acknowledge: Joi.boolean().required(),
      })
      .required()
      .unknown();
    const result = requestSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    let frontPicture = req.files.frontPicture[0].originalname.split(".");
    const frontMimeType = frontPicture[frontPicture.length - 1];
    const frontPictureParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uuidv4()}.${frontMimeType}`,
      Body: req.files.frontPicture[0].buffer,
    };
    let backPicture = req.files.backPicture[0].originalname.split(".");
    const backMimeType = backPicture[backPicture.length - 1];
    const backPictureParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uuidv4()}.${backMimeType}`,
      Body: req.files.backPicture[0].buffer,
    };
    s3.upload(frontPictureParams, async (error, frontData) => {
      if (error) {
        return res.status(500).send(error);
      }
      s3.upload(backPictureParams, async (error, backData) => {
        if (error) {
          return res.status(500).send(error);
        }
        body.backPicture = backData.Location;
        body.frontPicture = frontData.Location;
        body.formBy = req.user._id;
        body.document = "aadhaar";
        body.requestStatus = "pending";
        const formSchema = new hostFormdb(body);
        formSchema
          .save()
          .then(() => {
            return res.status(200).send({ message: "Form submitted" });
          })
          .catch((e) => {
            return res.status(500).send(e);
          });
      });
    });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};
//==================================== to know request status ========================================//
exports.getHostRequest = async (req, res) => {
  try {
    const result = await hostFormdb.findOne({ formBy: req.user._id });
    if (result) {
      return res.status(200).send(result);
    }
    return res.status(404).send({ message: "Not found" });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//===================================== request using pan ===========================================//
exports.requestHostUsingPan = async (req, res) => {
  try {
    const { body } = req;
    let date = new Date();
    date =
      date.getMonth() +
      1 +
      "-" +
      date.getDate() +
      "-" +
      (date.getFullYear() - 18);

    const requestSchema = Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dob: Joi.date().less(date).required(),
        email: Joi.string().email().required(),
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
        acknowledge: Joi.boolean().required(),
      })
      .required()
      .unknown();
    const result = requestSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    let frontPicture = req.files.frontPicture[0].originalname.split(".");
    const frontMimeType = frontPicture[frontPicture.length - 1];
    const frontPictureParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uuidv4()}.${frontMimeType}`,
      Body: req.files.frontPicture[0].buffer,
    };
    s3.upload(frontPictureParams, async (error, frontData) => {
      if (error) {
        return res.status(500).send(error);
      }
      body.frontPicture = frontData.Location;
      body.formBy = req.user._id;
      body.document = "PAN";
      body.requestStatus = "pending";
      const formSchema = new hostFormdb(body);
      formSchema
        .save()
        .then(() => {
          return res.status(200).send({ message: "Form submitted" });
        })
        .catch((e) => {
          return res.status(500).send(e);
        });
    });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};
