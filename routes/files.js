const filesRouter = require("express").Router();
const asyncHandler = require("express-async-handler");
const requireRequestBody = require("../middlewares/requireRequestBody.js");
const requireCurrentUser = require("../middlewares/requireCurrentUser.js");
const {
  handleAllFiles,
  handleAFile,
  handleFileCreation,
  handleFileDeletion,
  handleAllFilesByUser,
} = require("../controllers/files");
const handleImageUpload = require("../middlewares/handleImageUpload");

filesRouter.get("/", asyncHandler(handleAllFiles));
filesRouter.get("/:id", asyncHandler(handleAFile));
filesRouter.get("/users/:id", asyncHandler(handleAllFilesByUser));
filesRouter.delete(
  "/:id",
  requireCurrentUser,
  asyncHandler(handleFileDeletion)
);
filesRouter.post(
  "/",
  requireCurrentUser,
  handleImageUpload,
  requireRequestBody,
  asyncHandler(handleFileCreation)
);

module.exports = filesRouter;
