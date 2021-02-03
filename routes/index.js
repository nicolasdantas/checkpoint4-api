const usersRouter = require("./users");

// eslint-disable-next-line
module.exports = (app) => {
  app.use('/users', usersRouter);
};
