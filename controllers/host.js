const Joi = require("joi");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const hostdb = require("../models/host");
const userdb = require("../models/profile");
const refreshTokendb = require("../models/refreshToken");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  Bucket: process.env.BUCKET_NAME,
});
//=============================================== send OTP =============================================//
exports.sendOTP = async (req, res) => {
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
    const isHost = await hostdb.findOne({ phone: req.body.phone });
    if (!isHost) {
      return res.status(400).send({ message: "You're not host" });
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
///========================================== verify otp ===============================================//
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
          const isHost = await hostdb.findOne({
            phone: req.body.phone,
          });
          if (!isHost) {
            return res.status(400).send({ message: "You're not host" });
          }
          const p = isHost._id.toString();
          await refreshTokendb.findOneAndUpdate(
            { userId: p },
            { refreshToken: myRefreshToken },
            { upsert: true }
          );
          const token = jwt.sign({ _id: p }, process.env.TOKEN_PASSWORD, {
            expiresIn: "24h",
          });
          return res.status(200).send({
            data: isHost,
            token: token,
            refreshToken: myRefreshToken,
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
//======================================== show host's profile =========================================//
exports.showProfile = async (req, res) => {
  try {
    const hostProfile = await hostdb.findById(req.user._id);
    if (!hostProfile) {
      return res.status(500).send({ message: "Something went wrong" });
    }
    return res.status(200).send(hostProfile);
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};
//====================================== update host's profile ========================================//
exports.updateProfile = async (req, res) => {
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
    const profileSchema = Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dob: Joi.date().less(date).required(),
        city: Joi.string().required(),
        aboutMe: Joi.string().required(),
      })
      .required();
    const result = profileSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    const isUpdated = await hostdb.findByIdAndUpdate(req.user._id, body);
    if (!isUpdated) {
      return res.status(500).send({ message: "Something went wrong" });
    }
    return res.status(200).send({ message: "Updated successfully" });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};
//==================================== update host's online status ==================================//
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { body } = req;
    const joiValidation = Joi.object()
      .keys({
        onlineStatus: Joi.boolean().required(),
      })
      .required();
    const isValidated = joiValidation.validate(body);
    if (isValidated.error) {
      return res
        .status(400)
        .send({ message: isValidated.error.details[0].message });
    }
    const result = await hostdb.findByIdAndUpdate(req.user._id, {
      onlineStatus: body.onlineStatus,
    });
    if (!result) {
      return res.status(500).send({ message: "Something went wrong" });
    }
    return res.status(200).send({ message: "Updated Sucessfully" });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};
//=================================== upload pictures ==============================================//
exports.uploadPictures = async (req, res) => {
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
      }
      const result = await hostdb.findByIdAndUpdate(req.user._id, {
        $push: { pictures: data.Location },
      });
      if (result) {
        return res.status(200).send({ message: "Uploading done" });
      }
      return res.status(500).send({ message: "Something bad happened" });
    });
  } catch (e) {
    return res.status(500).send({ message: e.name });
  }
};
//======================================== block users ============================================//
exports.blockUsers = async (req, res) => {
  try {
    const { body } = req;
    const blockSchema = Joi.object()
      .keys({
        userId: Joi.string().hex().length(24),
      })
      .required();
    const result = blockSchema.validate(body);
    if (result.error) {
      return res.status(400).send({ message: result.error.details[0].message });
    }
    const pushToHosts = await hostdb.findByIdAndUpdate(req.user._id, {
      $push: { blockedUsers: req.body.userId },
    });
    if (!pushToHosts) {
      return res
        .status(500)
        .send({ message: "Somthing bad happened while blocking" });
    }
    const pushToUsers = await userdb.findByIdAndUpdate(req.body.userId, {
      $push: { blockedBy: req.user._id },
    });
    if (!pushToUsers) {
      return res
        .status(500)
        .send({ message: "Somthing bad happened while blocking" });
    }
    return res.status(200).send({ message: "Blocked successfully" });
  } catch (e) {
    return res.status(500).send({ message: "Something bad happened" });
  }
};
