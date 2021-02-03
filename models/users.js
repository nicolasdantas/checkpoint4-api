const argon2 = require("argon2");
const Joi = require("joi");
const crypto = require("crypto");
const moment = require("moment");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const definedAttributesToSqlSet = require("../helpers/definedAttributesToSQLSet.js");
const { ValidationError, RecordNotFoundError } = require("../error-types");
const db = require("../db.js");
const { SENDINBLUE_API_KEY, CLIENT_URL } = require("../env");

const findOne = async (id, failIfNotFound = true) => {
  const userId = id;
  const rows = await db.query("SELECT * FROM users WHERE user_id=?", [userId]);
  if (rows.length) {
    delete rows[0].user_encpwd;
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError("users", userId);
  return null;
};

/// / HELPERS ////

// hash password
const hashPassword = async (password) => argon2.hash(password);

// verify password between plain password and encrypted password
const verifyPassword = async (user, plainPassword) => {
  return argon2.verify(user.user_encpwd, plainPassword);
};

// verify if email already exists in the database
const emailAlreadyExists = async (email) => {
  const rows = await db.query("SELECT * FROM users WHERE user_email = ?", [
    email,
  ]);
  if (rows.length) {
    return true;
  }
  return false;
};

// validate datas on update or create
const validate = async (attributes, options = { udpatedRessourceId: null }) => {
  const { udpatedRessourceId } = options;
  const forUpdate = !!udpatedRessourceId;
  const schema = Joi.object().keys({
    user_firstname: forUpdate
      ? Joi.string()
          .min(1)
          .max(70)
          .regex(/^[a-z ,.'-]+$/i)
          .messages({
            "string.min": "Prénom manquant",
            "string.max": "Le prénom ne doit pas excéder 30 caractères",
            "string.pattern.base":
              "Votre prénom contient des caractères non autorisés",
          })
      : Joi.string()
          .min(1)
          .max(70)
          .required()
          .regex(/^[a-z ,.'-]+$/i)
          .messages({
            "string.min": "Prénom manquant",
            "string.max": "Le prénom ne doit pas excéder 30 caractères",
            "string.pattern.base":
              "Votre prénom contient des caractères non autorisés",
          }),
    user_lastname: forUpdate
      ? Joi.string()
          .min(1)
          .max(70)
          .regex(/^[a-z ,.'-]+$/i)
          .messages({
            "string.min": "Nom manquant",
            "string.max": "Le nom ne doit pas excéder 70 caractères",
            "string.pattern.base":
              "Votre nom contient des caractères non autorisés",
          })
      : Joi.string()
          .min(1)
          .max(70)
          .required()
          .regex(/^[a-z ,.'-]+$/i)
          .messages({
            "string.min": "Nom manquant",
            "string.max": "Le nom ne doit pas excéder 70 caractères",
            "string.pattern.base":
              "Votre nom contient des caractères non autorisés",
          }),
    user_email: forUpdate
      ? Joi.string().email()
      : Joi.string().email().required().messages({
          required: "Email manquant",
          "string.email": "Votre email n'est pas valide",
        }),
    password: forUpdate
      ? Joi.string().min(8).max(25).messages({
          "string.min": "Le mot de passe doit comprendre au moins 8 caractères",
          "string.max":
            "Le mot de passe doit comprendre moins de 25 caractères",
        })
      : Joi.string().min(8).max(25).required().messages({
          "string.min": "Le mot de passe doit comprendre au moins 8 caractères",
          "string.max":
            "Le mot de passe doit comprendre moins de 25 caractères",
        }),
    user_image: forUpdate ? Joi.allow("") : Joi.allow(""),
    password_confirmation: Joi.when("password", {
      is: Joi.string().min(8).max(30).required(),
      then: Joi.any()
        .equal(Joi.ref("password"))
        .required()
        .messages({ "any.only": "Les mots de passe ne correspondent pas" }),
    }),
  });

  const { error } = schema.validate(attributes, {
    abortEarly: false,
  });
  if (error)
    throw new ValidationError([
      {
        message: error.details.map((err) => err.message),
        path: ["joi"],
        type: "unique",
      },
    ]);

  if (attributes.user_email) {
    let shouldThrow = false;
    if (forUpdate) {
      const toUpdate = await findOne(udpatedRessourceId);
      shouldThrow =
        !(toUpdate.user_email === attributes.user_email) &&
        (await emailAlreadyExists(attributes.user_email));
    } else {
      shouldThrow = await emailAlreadyExists(attributes.user_email);
    }
    if (shouldThrow) {
      throw new ValidationError([
        { message: ["Cet email existe déjà"], path: ["email"], type: "unique" },
      ]);
    }
  }
};

/// / MODELS ////

// find an user by his email
const findByEmail = async (email, failIfNotFound = true) => {
  const rows = await db.query("SELECT * FROM users WHERE user_email = ?", [
    email,
  ]);
  if (rows.length) {
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError();
  return null;
};

// find all users in database
const findAll = async () => {
  return db.query(`SELECT * FROM users`);
};

// create an user
const createUser = async (datas) => {
  await validate(datas);
  const { password, password_confirmation, ...datasWithoutPasswords } = datas; // remove passwords from datas object
  const user_encpwd = await hashPassword(password); // encrypt password with argon2
  const datasToSave = { ...datasWithoutPasswords, user_encpwd }; // add encrypted password
  return db
    .query(
      `INSERT INTO users SET ${definedAttributesToSqlSet(datasToSave)}`,
      datasToSave
    )
    .then((res) => findOne(res.insertId));
};

// delete one user by his Id
const deleteUser = async (id, failIfNotFound = true) => {
  const res = await db.query("DELETE FROM users WHERE user_id=?", [id]);
  if (res.affectedRows !== 0) {
    return true;
  }
  if (failIfNotFound) throw new RecordNotFoundError("users", id);
  return false;
};
// update one user by his id

const updateUser = async (id, newAttributes) => {
  await validate(newAttributes, { udpatedRessourceId: id });
  const { password, password_confirmation, ...otherAttributes } = newAttributes;
  const user_encpwd = password && (await argon2.hash(password));
  const attributesToSave = { ...otherAttributes, user_encpwd };
  const namedAttributes = definedAttributesToSqlSet(attributesToSave);
  return db
    .query(`UPDATE users SET ${namedAttributes} WHERE user_id = :id`, {
      ...attributesToSave,
      id,
    })
    .then(() => findOne(id));
};

const sendLinkToResetPassword = (datas) => {
  console.log(datas);
  const { email, token, userId, user_firstname } = datas;
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = SENDINBLUE_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "DaddyTrasfer- Mise à jour de votre mot de passe";
  sendSmtpEmail.htmlContent = `<html><body><h2>Bonjour ${user_firstname}, veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe</h2>
  <a href=${CLIENT_URL}reset/${userId}/${token}>Cliquez ici</a><p>Attention, ce lien est valable 15 minutes.</p><p>A bientôt</p><p>L'équipe DaddyTransfer</p></body></html>`;
  sendSmtpEmail.sender = {
    name: `DaddyTransfer`,
    email: "no-reply@no-reply.com",
  };
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.replyTo = {
    name: `DaddyTransfer`,
    email: "no-reply@no-reply.com",
  };

  try {
    apiInstance.sendTransacEmail(sendSmtpEmail);
    return;
  } catch (err) {
    console.error(err);
  }
};

// find one user by his id in forgot_password table
const findOneInForgotPassword = async (id) => {
  const userId = id;
  const rows = await db.query(
    "SELECT * FROM forgot_pwd WHERE users_user_id=?",
    [userId]
  );
  if (rows.length) {
    return rows[0];
  }
  return false;
};

const resetPassword = async (email) => {
  const user = await findByEmail(email);
  const { user_firstname, user_lastname } = user;
  const userId = user.user_id;
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = await argon2.hash(token);
  const hasAlreadyReset = await findOneInForgotPassword(userId);
  const expire = moment().add(900, "seconds").format();
  if (hasAlreadyReset) {
    await db.query("DELETE FROM `forgot_pwd` WHERE users_user_id = ?", [
      userId,
    ]);
    await db.query(
      "INSERT INTO `forgot_pwd` (users_user_id, forgot_pwd_token, forgot_pwd_expire) VALUES (?, ?, ?)",
      [userId, hashedToken, expire]
    );
  } else {
    await db.query(
      "INSERT INTO `forgot_pwd` (users_user_id, forgot_pwd_token, forgot_pwd_expire) VALUES (?, ?, ?)",
      [userId, hashedToken, expire]
    );
  }
  await sendLinkToResetPassword({
    email,
    token,
    userId,
    user_firstname,
    user_lastname,
  });
};

const validatePasswords = async (attributes) => {
  const schema = Joi.object().keys({
    newPassword: Joi.string().min(8).max(25).required().messages({
      "string.min": "Le mot de passe doit comprendre au moins 8 caractères",
      "string.max": "Le mot de passe doit comprendre moins de 25 caractères",
    }),
    newPasswordConfirmation: Joi.when("password", {
      is: Joi.string().min(8).max(30).required(),
      then: Joi.any()
        .equal(Joi.ref("password"))
        .required()
        .messages({ "any.only": "Les mots de passe ne correspondent pas" }),
    }),
  });

  const { error } = schema.validate(attributes, {
    abortEarly: false,
  });
  if (error)
    throw new ValidationError([
      {
        message: error.details.map((err) => err.message),
        path: ["joi"],
        type: "unique",
      },
    ]);
};

const storePassword = async (datas) => {
  const { userId, newPassword, newPasswordConfirmation, token } = datas;
  await validatePasswords({ newPassword, newPasswordConfirmation });
  const isUserIdExist = await findOneInForgotPassword(userId);
  if (!isUserIdExist) {
    throw new RecordNotFoundError(
      "Erreur, veuillez refaire une demande de mot de passe",
      userId
    );
  } else {
    const verifyTokens = await argon2.verify(
      isUserIdExist.forgot_pwd_token,
      token
    );
    const linkHasAlreadyBeUsed = await db.query(
      "SELECT * from forgot_pwd WHERE users_user_id = ? AND forgot_pwd_hasbeused = 0",
      [userId]
    );
    const isTokenHasExpired = () => {
      const { forgot_pwd_expire } = linkHasAlreadyBeUsed[0];
      if (forgot_pwd_expire < moment().format()) {
        throw new RecordNotFoundError(
          "La validité du lien est dépassée, veuillez faire une autre demande",
          userId
        );
      }
      return false;
    };
    if (verifyTokens && linkHasAlreadyBeUsed.length && !isTokenHasExpired()) {
      const newHashedPassword = await argon2.hash(newPassword);
      await db.query(
        "UPDATE forgot_pwd SET forgot_pwd_hasbeused = 1 WHERE users_user_id = ?",
        [userId]
      );
      return db.query("UPDATE users SET user_encpwd = ? WHERE user_id = ?", [
        newHashedPassword,
        userId,
      ]);
    }
    throw new RecordNotFoundError(
      "Erreur, veuillez refaire une demande de mot de passe",
      userId
    );
  }
};

module.exports = {
  createUser,
  verifyPassword,
  findByEmail,
  findAll,
  findOne,
  deleteUser,
  updateUser,
  resetPassword,
  storePassword,
};
