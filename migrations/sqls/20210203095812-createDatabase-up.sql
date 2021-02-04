-- MySQL Workbench Forward Engineering
-- -----------------------------------------------------
  -- Schema checkpoint4_api_database
  -- -----------------------------------------------------
  -- -----------------------------------------------------
  -- Schema checkpoint4_api_database
  -- -----------------------------------------------------
  CREATE SCHEMA IF NOT EXISTS `checkpoint4_api_database`;
USE `checkpoint4_api_database`;
-- -----------------------------------------------------
  -- Table `checkpoint4_api_database`.`users`
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `checkpoint4_api_database`.`users` (
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `user_email` VARCHAR(255) NOT NULL,
    `user_firstname` VARCHAR(255) NOT NULL,
    `user_lastname` VARCHAR(255) NOT NULL,
    `user_encpwd` VARCHAR(255) NOT NULL COMMENT '\n',
    `user_image` VARCHAR(255),
    PRIMARY KEY (`user_id`)
  ) ENGINE = InnoDB;
-- -----------------------------------------------------
  -- Table `checkpoint4_api_database`.`files`
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `checkpoint4_api_database`.`files` (
    `file_id` INT NOT NULL AUTO_INCREMENT,
    `file_path` VARCHAR(255) NOT NULL,
    `users_user_id` INT NOT NULL,
    `file_expire` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`file_id`),
    INDEX `fk_files_users_idx` (`users_user_id` ASC) VISIBLE,
    CONSTRAINT `fk_files_users` FOREIGN KEY (`users_user_id`) REFERENCES `checkpoint4_api_database`.`users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
  ) ENGINE = InnoDB;
-- -----------------------------------------------------
  -- Table `checkpoint4_api_database`.`forgot_pwd`
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `checkpoint4_api_database`.`forgot_pwd` (
    `forgot_pwd_id` INT NOT NULL AUTO_INCREMENT,
    `forgot_pwd_token` VARCHAR(255) NOT NULL,
    `forgot_pwd_expire` VARCHAR(255) NOT NULL,
    `forgot_pwd_hasbeused` TINYINT NOT NULL DEFAULT 0,
    `users_user_id` INT NOT NULL,
    PRIMARY KEY (`forgot_pwd_id`, `users_user_id`),
    INDEX `fk_forgot_pwd_users1_idx` (`users_user_id` ASC) VISIBLE,
    CONSTRAINT `fk_forgot_pwd_users1` FOREIGN KEY (`users_user_id`) REFERENCES `checkpoint4_api_database`.`users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
  ) ENGINE = InnoDB;