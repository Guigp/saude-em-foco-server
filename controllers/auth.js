const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  if (!req.body.email || !req.body.password) {
    const error = new Error();
    error.statusCode = 401;
    error.message = "Dados incompletos!";
    throw error;
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        const error = new Error();
        error.statusCode = 401;
        error.message = "Usuário não encontrado!";
        throw error;
      }
      loadedUser = user;

      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error("Senha errada!");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        { email: loadedUser.email, userId: loadedUser._id.toString() },
        keys.authSecret,
        { expiresIn: 86400 }
      );
      res.status(200).json({
        _id: loadedUser._id,
        name: loadedUser.name,
        email: loadedUser.email,
        token: token,
        genre: loadedUser.genre ? loadedUser.genre : null,
        avatar: loadedUser.avatar ? loadedUser.avatar : null,
        userId: loadedUser._id.toString(),
        expiresIn: 86400 // dia
      });
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Falha na validação!");
    error.statusCode = 422;
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then(hashedPw => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: "Usuário criado!", userId: result._id });
    })
    .catch(error => {
      res.status(422).json(err);
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(err);
    });
};

exports.updateUser = async (req, res, next) => {
  let avatarURL = null;
  if (req.file) {
    avatarURL = req.file.path.replace("\\", "/"); //path é inserido pelo multer com o caminho para o arquivo no db
  }

  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Wrong data,no user!");
  }

  const name = req.body.name;
  const email = req.body.email;
  const genre = req.body.genre;

  try {
    if (name) user.name = name;
    if (email) user.email = email;
    if (genre) user.genre = genre;
    if (avatarURL) user.avatar = avatarURL;
    await user.save();
    res.status(201).json({
      message: "Avatar enviado com sucesso!",
      user: {
        name: name ? name : null,
        email: email ? email : null,
        genre: genre ? genre : null,
        avatar: avatarURL ? avatarURL : null
      }
    });
  } catch (error) {
    res.status(422).json(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
