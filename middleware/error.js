const errorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = statusCode || 500;
  err.message = message || "Internal Server Error";

  //mongodb invalid id error
  if (err.name === "CastError") {
    const message = `Resource not found.`;
    err = new errorHandler(message, 400);
  }

  //jwt invalid
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = new errorHandler(message, 401);
  }

  //jwt expired
  if (err.name === "TokenExpiredError") {
    const message = "Your Token has Expired! Please Login again.";
    err = new errorHandler(message, 401);
    err.tokenExpired = true;
  }

  //duplicate id
  if (err.code === "11000") {
    const message = "Duplicate field value entered";
    err = new errorHandler(message, 409);
    err.field = err.key;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
