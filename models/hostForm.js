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
  document: {
    type: String,
    required: true,
  },
  frontPicture: {
    type: String,
    required: true,
  },
  backPicture: {
    type: String,
    required: true,
  },
  acknowledge: {
    type: Boolean,
    required: true,
  },
});
module.exports = model("hostform", hostFormSchema);
