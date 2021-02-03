const db = require("../db.js");
const { RecordNotFoundError } = require("../error-types");
const definedAttributesToSqlSet = require("../helpers/definedAttributesToSQLSet.js");

const findAllFiles = async () => {
  return db.query("SELECT * FROM files");
};

const findAFile = async (id, failIfNotFound = true) => {
  const rows = await db.query("SELECT * FROM files WHERE file_id = ?", [id]);
  if (rows.length) {
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError();
  return null;
};

const createFile = async (formData) => {
  return db
    .query(
      `INSERT INTO files SET ${definedAttributesToSqlSet(formData)}`,
      formData
    )
    .then((res) => findAFile(res.insertId));
};

const verifyIfOwnerOfFile = (userId, fileId) => {
  return db.query(
    "SELECT * FROM files WHERE file_id = ? AND users_user_id = ?",
    [fileId, userId]
  );
};

const deleteFile = async (userId, fileId) => {
  console.log(fileId);
  if (verifyIfOwnerOfFile(userId, fileId)) {
    return db.query("DELETE FROM files WHERE file_id = ?", fileId);
  }
  return null;
};

module.exports = {
  findAllFiles,
  findAFile,
  createFile,
  deleteFile,
};
