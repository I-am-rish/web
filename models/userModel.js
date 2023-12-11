const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Email"],
      validator: [validator.isEmail, "Please Enter a valid Email"],
      // unique: true,
    },
    mobile: {
      type: Number,
      required: [true, "Please Enter Mobile"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Password"],
      minLength: [8, "Password must contain 8 char.. "],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    resetPasswordOTP: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//sign jwt token
UserSchema.methods.generateJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//compare password
UserSchema.methods.comparePasswords = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//reset password
// UserSchema.methods.generateResetPasswordToken = function () {
//   //generate a new random token
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   //creating hax of token to make secure
//   this.resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");
//   this.resetPasswordExpire = Date.now() + 5 * 60 * 1000; //token expire after 10 minutes
//   return resetToken;
// };

UserSchema.methods.generateResetPasswordOTP = function () {
  //generate a new random otp
  const resetOTP = Math.floor(Math.random() * 1000000).toString();
  this.resetPasswordOTP = crypto
    .createHash("sha256")
    .update(resetOTP)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 5 * 60 * 1000; //token expire after 10 minutes
  return resetOTP;
};

module.exports = mongoose.model("User", UserSchema);
