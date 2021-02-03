const currentUserRouter = require('express').Router();
const asyncHandler = require('express-async-handler');
const { handleGetProfile } = require('../controllers/currentUser.js');
const requireCurrentUser = require('../middlewares/requireCurrentUser.js');

currentUserRouter.get('/', requireCurrentUser, asyncHandler(handleGetProfile));

module.exports = currentUserRouter;
