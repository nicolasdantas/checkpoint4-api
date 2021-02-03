const SibApiV3Sdk = require("sib-api-v3-sdk");
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
  sendSmtpEmail.sender = { name: "DaddyTransfer", email: recipient };
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

const findAFile = async (id, failIfNotFound = true) => {
  const rows = await db.query(
    "SELECT * FROM files AS f JOIN users as u ON f.users_user_id = u.user_id",
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
    return db.query("DELETE FROM files WHERE file_id = ?", fileId);
  }
  throw new UnauthorizedError();
};

module.exports = {
  findAllFiles,
  findAFile,
  createFile,
  deleteFile,
};
