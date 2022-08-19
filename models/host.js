const { model, Schema } = require("mongoose");
const hostSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    aboutMe: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    onlineStatus: {
      type: Boolean,
      default: true,
    },
    pictures: [
      {
        type: String,
      },
    ],
    blockedUsers: [
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
module.exports = model("host", hostSchema);
