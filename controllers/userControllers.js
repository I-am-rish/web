const { log } = require("console");
const User = require("../models/userModel");
const ApiFeatures = require("../utils/apiFeatures");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//register user
exports.registerUser = async (req, res, next) => {
  const { name, email, mobile, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          msg: "Password must be more then 8 characters",
        });
      }
      // create a new user and save it to the database
      user = new User({
        name,
        email,
        mobile,
        password,
      });
      // await user.save();
      return res.status(201).json({ success: true, message: "User created" });
    } else {
      return res.status(400).json({
        success: false,
        msg: "User Already Exist",
      });
    }
  } catch (error) {
    return res.status(409).json({
      success: false,
      msg: error.message,
    });
  }
};

//login user
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an email and password",
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Email or Password",
      });
    } else {
      const isPasswordMatched = await user.comparePasswords(password);
      if (isPasswordMatched) {
        sendToken(user, 200, res);
      } else {
        return res.status().json({
          success: false,
          msg: "Password didn't matched",
        });
      }
    }
  } catch (error) {
    return res.status(404).json({
      success: false,
      msg: "Invalid Email or Password",
    });
  }
};

//logout user
exports.logOutUser = async (req, res, next) => {
  res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });

  res.status(200).json({
    success: true,
    msg: "Logged out",
  });
};

//get user details
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        msg: "Error While Getting Profile",
      });
    } else {
      return res.status(200).json({
        success: true,
        user: user,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

//update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, mobile } = req.body;

    const newData = {
      name,
      email,
      mobile,
    };
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      newData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        msg: "Something Went Wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Profile Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.msg || "Server Error",
    });
  }
};

//forget password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        msg: "Please enter your registered email",
      });
    } else {
      let user = await User.findOne({ email });
      await user.save({ resetPasswordOTP: null });
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "No account associated to this email",
        });
      }
      // const token = await user.generateResetPasswordToken();
      const otp = await user.generateResetPasswordOTP();
      await user.save({ validateBeforeSave: false });
      // const resetUrl = `${req.protocol}://${req.get(
      //   "host"
      // )}/api/password/reset/:${token}`;

      //generate random otp

      const mailOptions = {
        email,
        subject: "Reset Password OTP",
        message: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n
          Your OTP IS:  ${otp} \n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };
      await sendEmail(mailOptions);
      return res.status(200).json({
        success: true,
        message: `Email sent to ${email} successfully`,
      });
    }
  } catch (error) {
    return res.status(401).json({ success: false, msg: error.message });
  }
};

//reset password
exports.resetPassword = async (req, res, next) => {
  const { otp, new_password } = req.body;
  console.log(otp, new_password);
  try {
    if (!new_password) {
      return res.status(400).json({
        success: false,
        msg: "Please Provide New Password",
      });
    }

    const user = await User.findOne({
      resetPasswordOTP: otp,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid OTP",
      });
    }
    user.password = new_password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordOTP = undefined;
    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Invalid OTP",
    });
  }
};

//delete a user
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    let deletedUser = await User.findOneAndDelete({ _id: userId });
    if (!deletedUser) {
      return res.status(400).json({
        success: false,
        msg: "Couldn't Delete User",
      });
    }
    return res.status(200).json({ success: true, msg: "Deleted Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Internal Server Error" });
  }
};

//get all user (admin)
exports.allUsers = async (req, res, next) => {
  try {
    const pageNumber = req.query.pageNumber || 1;
    const resultPerPage = req.query.resultPerPage || 10;
    const userCount = await User.countDocuments();
    const apiFeatures = new ApiFeatures(User.find(), pageNumber).pagination(
      resultPerPage
    );
    // .search();

    const users = await apiFeatures.query;

    if (!users) {
      return res.status(400).json({
        success: true,
        msg: "No User Found",
      });
    }
    return res.status(200).json({ success: true, userCount, data: { users } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Something went wrong!",
      error: error.message,
    });
  }
};

//delete a user {Admin}
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).json({ msg: "User Not Found!" });
    }

    const deletedUser = await User.findOneAndDelete({ _id: id });
    if (!deletedUser) {
      return res.status(400).json({
        success: false,
        msg: "User couldn't deleted",
      });
    }
    return res.status(200).json({
      success: true,
      msg: "User Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error In Deleting The User",
      error: error.message,
    });
  }
};

//update user role (Admin)
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res
        .status(400)
        .json({ success: false, msg: "Please provide Role" });
    }
    const newRole = { role };
    const userId = req.query.id;
    const updatedUser = await User.findOneAndUpdate({ _id: userId }, newRole, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res
        .status(400)
        .json({ success: false, msg: "Something Went Wrong" });
    }
    return res.status(200).json({
      success: true,
      msg: "Successfully Updated Role!",
      role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};
