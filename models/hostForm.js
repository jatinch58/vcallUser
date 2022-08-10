const { model, Schema } = require("mongoose");
const hostFormSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  formBy: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
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
  document: {
    type: String,
    required: true,
  },
  frontPicture: {
    type: String,
  },
  backPicture: {
    type: String,
  },
  acknowledge: {
    type: Boolean,
    required: true,
  },
  requestStatus: {
    type: String,
    required: true,
  },
});
module.exports = model("hostform", hostFormSchema);
