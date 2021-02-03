const usersRouter = require("./users");
const authRouter = require("./auth");

// eslint-disable-next-line
module.exports = (app) => {
  app.use("/users", usersRouter);
  app.use("/auth", authRouter);
};
