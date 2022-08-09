const multer = require("multer");
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
exports.upload = multer({ storage }).single("image");
const upload = multer({ storage });
exports.uploadAadhaarForm = upload.fields([
  { name: "frontPicture", maxCount: 1 },
  { name: "backPicture", maxCount: 1 },
]);
exports.uploadPanForm = upload.fields([{ name: "frontPicture", maxCount: 1 }]);
// exports.formUpload1 = upload.fields([
//   { name: "prescription", maxCount: 1 },
//   { name: "idProof", maxCount: 1 },
// ]);
