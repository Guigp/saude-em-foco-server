const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complaintSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    locationName: {
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
    imageURL: {
      type: String
    },

    informations: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
