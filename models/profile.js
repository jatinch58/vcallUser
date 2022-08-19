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
    blockedHosts: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    blockedBy: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);
module.exports = model("userprofile", userProfileSchema);
