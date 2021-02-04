const {
  findAllFiles,
  findAllFilesByUser,
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
module.exports.handleAllFilesByUser = async (req, res) => {
  const datas = await findAllFilesByUser(req.params.id);
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
  console.log(req.session);
  const file = req.file ? req.file.path : null;
  const { userId } = req.session;
  const { file_expire, recipient } = req.body;
  const { filename } = req.file;
  const createdUserId = await createFile({
    users_user_id: userId,
    file_expire,
    file_path: file,
    recipient,
    filename,
  });
  return res.status(201).json(createdUserId);
};

module.exports.handleFileDeletion = async (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  await deleteFile(userId, id);
  res.sendStatus(204);
};
