const { log } = require("console");
const User = require("../models/userModel");
const ApiFeatures = require("../utils/apiFeatures");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//register user
exports.registerUser = async (req, res, next) => {
  const { name, email, mobile, password } = req.body;
  console.log(req.body);
  try {
    let user = await User.findOne({ email });
    if (!user) {
      // create a new user and save it to the database
      user = new User({
        name,
        email,
        mobile,
        password,
      });
      await user.save();
      return res.status(201).json({ message: "User created" });
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
      throw Error("Please enter your registered email");
    } else {
      let user = await User.findOne({ email });
      await user.save({ resetPasswordToken: null });
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "No account associated to this email",
        });
      } else {
        const token = await user.generateResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/password/reset/:${token}`;

        const mailOptions = {
          email,
          subject: "Reset Password Link",
          message: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          ${resetUrl}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };
        await sendEmail(mailOptions);
        return res.status(200).json({
          message: `Email sent to ${email} successfully`,
        });
      }
    }
  } catch (error) {
    return res.status(401).json({ msg: error.message });
  }
};

//reset password
exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { new_password, confirm_new_password } = req.body;
  try {
    if (!new_password || !confirm_new_password) {
      return res.status(400).json({
        success: false,
        msg: "Please Provide New Password and Confirm Password",
      });
    }
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Token!!",
      });
    }

    if (new_password !== confirm_new_password) {
      return res.status(400).json({
        success: false,
        msg: "Password didn't match",
      });
    }
    user.password = new_password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
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
      return res.status(400).json({ msg: "Please provide Role" });
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
      msg: error.message,
    });
  }
};
