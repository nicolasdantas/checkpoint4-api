const usersRouter = require("express").Router();
const asyncHandler = require("express-async-handler");
const requireRequestBody = require("../middlewares/requireRequestBody.js");
const {
  handleAllUsers,
  handleAnUser,
  handleOneUserCreation,
  handleOneUserDeletion,
  handleOneUserUpdate,
} = require("../controllers/users");
const handleImageUpload = require("../middlewares/handleImageUpload");

usersRouter.get("/", asyncHandler(handleAllUsers));
usersRouter.get("/:id", asyncHandler(handleAnUser));
usersRouter.delete("/:id", asyncHandler(handleOneUserDeletion));
usersRouter.post(
  "/",
  handleImageUpload,
  requireRequestBody,
  asyncHandler(handleOneUserCreation)
);
usersRouter.put(
  "/:id",
  handleImageUpload,
  requireRequestBody,
  asyncHandler(handleOneUserUpdate)
);

module.exports = usersRouter;
