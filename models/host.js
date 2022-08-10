const { model, Schema } = require("mongoose");
const hostSchema = new Schema({
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
  pictures: [
    {
      type: String,
    },
  ],
});
module.exports = model("host", hostSchema);
