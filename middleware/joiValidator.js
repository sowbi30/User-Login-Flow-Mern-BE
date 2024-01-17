const Joi = require('joi');

// For user registration
const registerValidation = Joi.object({
  fname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  cpassword: Joi.string().valid(Joi.ref('password')).required(),
});

// For user login
const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// For sending password reset link
const sendPasswordLinkValidation = Joi.object({
  email: Joi.string().email().required(),
});

// For changing password
const changePasswordValidation = Joi.object({
  password: Joi.string().min(6).required(),
});

module.exports = {
  registerValidation,
  loginValidation,
  sendPasswordLinkValidation,
  changePasswordValidation,
};
