const errorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = statusCode || 500;
  err.message = message || "Internal Server Error";

  //mongodb invalid id error
  if (err.name === "CastError") {
    const message = `Resource not found.`;
    err = new errorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
