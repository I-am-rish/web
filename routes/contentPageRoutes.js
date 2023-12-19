const express = require("express");
const {
  updateContents,
  getAllContent,
  getSingleContent,
} = require("../controllers/contentPageControllers");
const { isAuthenticatedUser, authorizeRole } = require("../middleware/auth");

const router = express.Router();

router
  .route("/admin/content")
  .put(isAuthenticatedUser, authorizeRole, updateContents)
  .get(isAuthenticatedUser, authorizeRole, getAllContent)
  .get(isAuthenticatedUser, authorizeRole, getSingleContent);

module.exports = router;
