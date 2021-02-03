const { UnauthorizedError } = require('../error-types');
const User = require('../models/users');

module.exports = async (req, res, next) => {
  req.currentUser = await User.findOne(req.session.userId, false);
  if (!req.currentUser) {
    return next(new UnauthorizedError());
  }
  return next();
};