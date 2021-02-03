const downloadRouter = require("express").Router();

downloadRouter.get("/", function (req, res) {
  const file = `file-storage/public/${req.query.file}`;
  res.download(file); // Set disposition and send it.
});

module.exports = downloadRouter;
