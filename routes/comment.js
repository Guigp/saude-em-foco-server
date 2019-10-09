const express = require("express");
const commentController = require("../controllers/comment");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/getAllComments/:id", isAuth, commentController.getAllComments);
router.post("/addComment", isAuth, commentController.addComment);
router.delete("/deleteComment/:id", isAuth, commentController.deleteComment);

module.exports = router;
