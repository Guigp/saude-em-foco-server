const express = require("express");
const { body } = require("express-validator");
const User = require("../models/user");
const authController = require("../controllers/auth");

const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ Hello: "Hello World!" });
});
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

router.post("/login", authController.login);

router.post("/updateUser/:userId", isAuth, authController.updateUser);

module.exports = router;
