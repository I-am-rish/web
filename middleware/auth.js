const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

//Auth for user
exports.isAuthenticatedUser = async (req, res, next) => {
  console.log(req.user);
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Please login to access this resources" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

//Auth for admin
exports.authorizeRole = async (req, res, next) => {
  console.log("admin", req.user);
  // if (req.user.role === "admin") {
  //   next();
  // } else {
  //   return res
  //     .status(403)
  //     .json({ message: "You are not authorized to perform this action." });
  // }
};
