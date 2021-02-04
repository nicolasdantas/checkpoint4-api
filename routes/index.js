const usersRouter = require("./users");
const authRouter = require("./auth");
const currentUserRoutes = require('./currentUser');
const filesRouter = require('./files');
const downloadRouter = require('./download');

// eslint-disable-next-line
module.exports = (app) => {
  app.use("/download", downloadRouter);
  app.use("/users", usersRouter);
  app.use("/files", filesRouter);
  app.use("/auth", authRouter);
  app.use('/me', currentUserRoutes);
};
