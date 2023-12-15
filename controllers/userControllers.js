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
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be more then 6 characters",
        });
      }
      // create a new user and save it to the database
      user = await User.create({
        name,
        email,
        mobile,
        password,
      });
      // await user.save();
      return res
        .status(201)
        .json({ success: true, message: "User created", user });
    } else {
      return res.status(400).json({
        success: false,
        message: "User Already Exist",
      });
    }
  } catch (error) {
    return res.status(409).json({
      success: false,
      message: error.message,
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
        message: "Please provide an email and password",
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    } else {
      const isPasswordMatched = await user.comparePasswords(password);
      if (isPasswordMatched) {
        sendToken(user, 200, res);
      } else {
        return res.status().json({
          success: false,
          message: "Password didn't match",
        });
      }
    }
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Invalid Email or Password",
    });
  }
};

//logout user
exports.logOutUser = async (req, res, next) => {
  res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
};

//get user details
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Error While Getting Profile",
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
      message: err.message,
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
        message: "Something Went Wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
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
        message: "Please enter your registered email",
      });
    } else {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account associated to this email",
        });
      }

      // const token = await user.generateResetPasswordToken();
      const otp = await user.generateResetPasswordOTP();
      await user.save({ validateBeforeSave: false });
      // console.log(user);

      const mailOptions = {
        email,
        subject: "Reset Password OTP",
        message: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n
          Your OTP IS:  ${otp} \n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };
      try {
        await sendEmail(mailOptions);
        return res.status(200).json({
          success: true,
          message: `Email sent to ${email} successfully`,
        });
      } catch (error) {
        user.resetPasswordExpire = undefined;
        user.resetPasswordOTP = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

//reset password
exports.resetPassword = async (req, res, next) => {
  const { resetOTP, new_password } = req.body;
  try {
    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: "Please Provide New Password",
      });
    }
    //otp
    const resetPasswordOTP = crypto
      .createHash("sha256")
      .update(resetOTP)
      .digest("hex");


    const user = await User.findOne({
      resetPasswordOTP,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    user.password = new_password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordOTP = undefined;
    console.log(user);
    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message, //"Something Went Wrong",
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
        message: "Couldn't Deleted User",
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Deleted Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//get all user (admin)
exports.allUsers = async (req, res, next) => {
  try {
    const resultPerPage = req.query.resultPerPage || 10;
    // console.log("all users", req.query);
    const usersCount = await User.countDocuments();
    const apiFeatures = new ApiFeatures(User.find(), req.query)
      .pagination(resultPerPage)
      .search();

    const users = await apiFeatures.query;

    if (!users) {
      return res.status(400).json({
        success: true,
        message: "No User Found",
      });
    }
    return res.status(200).json({ success: true, usersCount, users });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

//delete a user {Admin}
exports.deleteUser = async (req, res, next) => {
  const { id } = req.query;
  try {
    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const deletedUser = await User.findOneAndDelete({ _id: id });
    if (!deletedUser) {
      return res.status(400).json({
        success: false,
        message: "User couldn't deleted",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error In Deleting The User",
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
        .json({ success: false, message: "Please provide Role" });
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
        .json({ success: false, message: "Something Went Wrong" });
    }
    return res.status(200).json({
      success: true,
      message: "Successfully Updated Role!",
      role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
