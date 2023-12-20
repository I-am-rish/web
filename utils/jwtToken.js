//create token and save in cookie

const sendToken = (user, statusCode, res) => {
  const token = user.generateJWTToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    // httpOnly: true,
  };
  //   if (process.env.NODE_ENV === "production") {
  //     options.secure = true;
  //   }
  // console.log(res.header('Authorization', token));
  res.status(statusCode).header("Authorization", token).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
