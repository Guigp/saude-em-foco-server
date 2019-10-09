var mongoose = require("mongoose");
const Comment = mongoose.model("Comment");
const Hospital = mongoose.model("Hospital");
const User = mongoose.model("User");
const io = require("../socket");

exports.addComment = async (req, res, next) => {
  const userId = req.userId;
  const hospitalId = req.body.hospitalId;
  const comment = req.body.comment;

  const hospital = await Hospital.findById(hospitalId);

  const newComment = new Comment({
    user: userId,
    hospital: hospital._id,
    comment: comment
  });
  try {
    await newComment.save();
    const user = await User.findById(userId);
    user.comments.push(newComment._id);
    await user.save();
    hospital.comments.push(newComment._id);
    await hospital.save();
    io.getIO().emit("comments", {
      action: "create",
      newComment: {
        ...newComment._doc,
        userName: user.name,
        userGenre: user.genre ? user.genre : null,
        userAvatar: user.avatar ? user.avatar : null
      }
    });
    res.status(201).json({ message: "Comentário criado com sucesso!" });
  } catch (error) {
    res.status(422).json(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getAllComments = async (req, res, next) => {
  try {
    const id = req.params.id;

    const comments = await Comment.find({ hospital: id }).sort({
      createdAt: -1
    });

    if (!comments) {
      throw (Error = new Error("Error while load comments!"));
    }
    let promise1 = null;
    promise1 = await comments.map(async comment => {
      const user = await User.findById(comment.user, {
        name: 1,
        genre: 1,
        avatar: 1
      });
      if (!user) {
        throw (Error = new Error("Error while load user!"));
      }

      return {
        ...comment._doc,
        userName: user.name,
        userGenre: user.genre ? user.genre : null,
        userAvatar: user.avatar ? user.avatar : null
      };
    });

    const allComments = await Promise.all(promise1);

    res.send({
      allComments: allComments
    });
  } catch (error) {
    res.status(422).json(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  const commentId = req.params.id;
  const userId = req.userId;

  try {
    let comment = await Comment.findById(commentId);
    let hospitalId = comment.hospital;

    if (!hospitalId) {
      const error = new Error("Comentário não encontrado!");
      error.statusCode = 404;
      throw error;
    }
    comment.remove(commentId);
    const user = await User.findById(userId);

    user.comments.pull(commentId);
    user.save();

    const hospital = await Hospital.findById(hospitalId);

    hospital.comments.pull(commentId);
    hospital.save();
    io.getIO().emit("comments", {
      action: "delete",
      oldComment: { commentId: commentId, hospitalId: hospitalId }
    });
    res.status(200).json({ message: "Comentário removido!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
