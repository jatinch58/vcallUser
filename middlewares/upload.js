const multer = require("multer");
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
exports.upload = multer({ storage }).single("image");
// const upload = multer({ storage });
// exports.formUpload = upload.fields([
//   { name: "prescription", maxCount: 1 },
//   { name: "idProof", maxCount: 1 },
//   { name: "insurance", maxCount: 1 },
// ]);
// exports.formUpload1 = upload.fields([
//   { name: "prescription", maxCount: 1 },
//   { name: "idProof", maxCount: 1 },
// ]);
