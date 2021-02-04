const SibApiV3Sdk = require("sib-api-v3-sdk");
const fs = require("fs");
const db = require("../db.js");
const { RecordNotFoundError, UnauthorizedError } = require("../error-types");
const definedAttributesToSqlSet = require("../helpers/definedAttributesToSQLSet.js");
const { SENDINBLUE_API_KEY, SERVER_URL } = require("../env");

const sendMail = (datas) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = SENDINBLUE_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  const {
    recipient,
    filename,
    sender_email,
    sender_firstname,
    sender_lastname,
  } = datas;
  sendSmtpEmail.templateId = 2;
  sendSmtpEmail.subject = "Vous avez reçu un nouveau fichier";
  sendSmtpEmail.sender = {
    name: `${sender_firstname} ${sender_lastname}`,
    email: sender_email,
  };
  sendSmtpEmail.to = [{ email: recipient }];

  sendSmtpEmail.params = {
    link: `${SERVER_URL}download?file=${filename}`,
    filename,
    sender_email,
    sender_firstname,
    sender_lastname,
  };

  try {
    apiInstance.sendTransacEmail(sendSmtpEmail);
    return;
  } catch (err) {
    console.error(err);
  }
};

const findAllFiles = async () => {
  return db.query(
    "SELECT * FROM files AS f JOIN users as u ON f.users_user_id = u.user_id"
  );
};

const findAllFilesByUser = async (userId) => {
  return db.query(
    "SELECT * FROM files AS f JOIN users as u ON f.users_user_id = u.user_id WHERE users_user_id = ?",
    [userId]
  );
};

const findAFile = async (id, failIfNotFound = true) => {
  const rows = await db.query(
    "SELECT f.file_id, f.file_path, u.user_id, u.user_email, u.user_firstname, u.user_lastname, u.user_image FROM files AS f JOIN users as u ON f.users_user_id = u.user_id WHERE f.file_id = ?",
    [id]
  );
  if (rows.length) {
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError();
  return null;
};

const createFile = async (formData) => {
  const { recipient, filename, ...datas } = formData;
  const result = await db
    .query(
      `INSERT INTO files SET ${definedAttributesToSqlSet(datas)}`,
      formData
    )
    .then((res) => findAFile(res.insertId));
  await sendMail({
    recipient,
    filename,
    sender_email: result.user_email,
    sender_firstname: result.user_firstname,
    sender_lastname: result.user_lastname,
  });
  return result;
};

const verifyIfOwnerOfFile = (userId, fileId) => {
  return db.query(
    "SELECT * FROM files WHERE file_id = ? AND users_user_id = ?",
    [fileId, userId]
  );
};

const deleteFile = async (userId, fileId) => {
  const isOwnerOfFile = await verifyIfOwnerOfFile(userId, fileId);
  if (isOwnerOfFile.length) {
    fs.unlink(isOwnerOfFile[0].file_path, (err) => {
      if (err) {
        console.error(err);
      }
    });
    return db.query("DELETE FROM files WHERE file_id = ?", [fileId]);
  }
  throw new UnauthorizedError();
};

module.exports = {
  findAllFiles,
  findAllFilesByUser,
  findAFile,
  createFile,
  deleteFile,
};
