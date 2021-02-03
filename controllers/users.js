const {
  findAll,
  findOne,
  createUser,
  deleteUser,
  updateUser,
} = require("../models/users.js");

module.exports.handleAllUsers = async (req, res) => {
  const datas = await findAll();
  res.send(
    datas.map(({ user_id, user_email, user_lastname, user_firstname }) => ({
      user_id,
      user_email,
      user_lastname,
      user_firstname,
    }))
  );
};

module.exports.handleAnUser = async (req, res) => {
  res.send(await findOne(req.params.id));
};

module.exports.handleOneUserCreation = async (req, res) => {
  const file = req.file ? req.file.path : null;
  const {
    user_email,
    user_lastname,
    user_firstname,
    password,
    password_confirmation,
  } = req.body;
  const createdUserId = await createUser({
    user_email,
    user_lastname,
    user_firstname,
    password,
    password_confirmation,
    user_image: file,
  });
  return res.status(201).json(createdUserId);
};

module.exports.handleOneUserDeletion = async (req, res) => {
  await deleteUser(req.params.id);
  res.sendStatus(204);
};

module.exports.handleOneUserUpdate = async (req, res) => {
  let file;
  if (req.file) {
    file = req.file.path;
  }
  const {
    user_email,
    user_lastname,
    user_firstname,
    password,
    password_confirmation,
  } = req.body;
  const attributes = {
    user_email,
    user_lastname,
    user_firstname,
    password,
    password_confirmation,
    user_image: file,
  };
  const data = await updateUser(req.params.id, attributes);
  res.send(data);
};
