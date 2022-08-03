const Joi = require("joi");
const axios = require("axios");
const userdb = require("../models/profile");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const refreshTokendb = require("../models/refreshToken");
//=========================================== user login =================================================//
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
///========================================== verify otp =================================================//
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
//============================================== refresh token ======================================//
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
//============================================= get profile ===========================================//
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
//========================================== update profile ==============================================//
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
//================================= upload profile picture ========================================//