const {
  findAllFiles,
  findAFile,
  createFile,
  deleteFile,
} = require("../models/files.js");

module.exports.handleAllFiles = async (req, res) => {
  const datas = await findAllFiles();
  res.send(
    datas.map(({ file_id, file_path, users_user_id, file_expire }) => ({
      file_id,
      file_path,
      users_user_id,
      file_expire,
    }))
  );
};

module.exports.handleAFile = async (req, res) => {
  res.send(await findAFile(req.params.id));
};

module.exports.handleFileCreation = async (req, res) => {
  const image = req.file ? req.file.path : null;
  const { user_id, file_expire } = req.body;
  const createdUserId = await createFile({
    users_user_id: user_id,
    file_expire,
    file_path: image,
  });
  return res.status(201).json(createdUserId);
};

module.exports.handleFileDeletion = async (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  await deleteFile(userId, id);
  res.sendStatus(204);
};