const express = require("express");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error");
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "./images" });

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//user routes
const user = require("./routes/userRoutes");
app.use("/api", user);
app.post("/api/user/profile/avatar", upload.single("avatar"), (req, res) => {
  console.log(req.body.avatar);
const data = req.body.avatar;
  res.status(200).json({
    success: true,
    data
  });
});

//content pages routes
const contentPage = require("./routes/contentPageRoutes");
app.use("/api", contentPage);

//middleware for err
app.use(errorMiddleware);

module.exports = app;
