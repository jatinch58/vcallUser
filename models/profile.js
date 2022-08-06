const { model, Schema } = require("mongoose");
const userProfileSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    gender: {
      type: String,
    },
    dob: {
      type: String,
    },
    aboutMe: {
      type: String,
    },
    city: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = model("userprofile", userProfileSchema);
