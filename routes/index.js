const usersRouter = require("./users");
const authRouter = require("./auth");
const currentUserRoutes = require('./currentUser');
const filesRouter = require('./files');

// eslint-disable-next-line
module.exports = (app) => {
  app.use("/users", usersRouter);
  app.use("/files", filesRouter);
  app.use("/auth", authRouter);
  app.use('/me', currentUserRoutes);
};
