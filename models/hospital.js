const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hospitalSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: [Number]
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
    waitingTime: [
      {
        type: Number,
        required: true
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);
