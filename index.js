require("dotenv/config");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routers/index");
const port = process.env.PORT || 8000;
app.use(express.json());
app.use(routes);
app.use(cors);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => {
    console.log({ error: e });
  });
app.listen(port, () => {
  console.log("Server is running on port: " + port);
});
