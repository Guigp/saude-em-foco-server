const express = require("express");
const { body } = require("express-validator/check");
const User = require("../models/user");
const authController = require("../controllers/auth");

const isAuth = require("../middleware/is-auth");
const router = express.Router();

// router.use("/", (req, res, next) => {
//   console.log("EMAIL00000:", req.body.email);
//   res.send("<h1>SAUDE EM FOCO RODANDO...</h1>");
// });

router.put(
  "/signup",
  [
    body("email")
      .isEmail()

      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject("Email já existe!");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 }),
    body("name")
      .trim()
      .not()
      .isEmpty()
  ],
  authController.signup
);

router.post(
  "/login",
  authController.login
  //res.redirect("/");
);

router.post("/updateUser/:userId", isAuth, authController.updateUser);

module.exports = router;
