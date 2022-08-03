const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  let p = req.header("authorization");
  if (p) {
    p = p.split(" ");
    const token = p[1];
    if (!token) {
      return res
        .status(499)
        .send({ message: "A token is required for authentication" });
    }
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_PASSWORD);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).send({ message: "Invalid Token" });
    }
  } else {
    return res
      .status(499)
      .send({ message: "A token is required for authentication" });
  }
};
