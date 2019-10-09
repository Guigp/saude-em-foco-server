const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    genre: {
      type: String
    },
    avatar: {
      type: String
    },
    complaints: [
      {
        type: Schema.Types.ObjectId,
        ref: "Complaint"
      }
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
