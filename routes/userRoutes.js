const express = require("express");
const {
  registerUser,
  allUsers,
  getProfile,
  loginUser,
  logOutUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  updateRole,
  deleteAccount,
  deleteUser,
} = require("../controllers/userControllers");

const { authorizeRole, isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

//user routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logOutUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset").put(resetPassword);
router.route("/user/profile").get(isAuthenticatedUser, getProfile);
router.route("/user/profile/update").put(isAuthenticatedUser, updateProfile);
router.route("/user/delete").delete(isAuthenticatedUser, deleteAccount);

//admin routes
router.route("/admin/users").get(isAuthenticatedUser, authorizeRole, allUsers);
router
  .route("/admin/users/user/delete")
  .delete(isAuthenticatedUser, authorizeRole, deleteUser);
router
  .route("/admin/users/user/update")
  .put(isAuthenticatedUser, authorizeRole, updateRole);

module.exports = router;
