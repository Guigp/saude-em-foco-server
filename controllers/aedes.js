const mongoose = require("mongoose");
const Complaint = mongoose.model("Complaint");
const User = mongoose.model("User");
const io = require("../socket");
const path = require("path");
const fs = require("fs");

exports.addComplaint = async (req, res, next) => {
  const locationName = req.body.locationName;
  const location = JSON.parse(req.body.location);
  const userId = req.userId;

  const complaint = new Complaint({
    user: req.userId,
    locationName: locationName,
    location: location
  });
  if (req.body.informations != "")
    complaint.informations = req.body.informations;

  if (req.file) {
    complaint.imageURL = req.file.path.replace("\\", "/");
  }
  try {
    await complaint.save();
    const user = await User.findById(userId);
    user.complaints.push(complaint);
    await user.save();
    io.getIO().emit("complaints", {
      action: "create",
      complaint: { ...complaint._doc, userName: user.name }
    });

    res.status(201).json({ message: "Denúncia criada com sucesso!" });
  } catch (error) {
    res.status(422).json(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getComplaints = async (req, res, next) => {
  let cmp;
  try {
    const allComplaints = await Complaint.find({});
    if (!allComplaints) {
      throw (Error = new Error("Error while load complaints!"));
    }
    cmp = allComplaints.map(async complaint => {
      const user = await User.findById(complaint.user, { name: 1 });
      if (!user) {
        throw (Error = new Error("Error while load user!"));
      }
      return { ...complaint._doc, userName: user.name };
    });
    const complaintObjReturn = await Promise.all(cmp);

    res.send({ allComplaints: complaintObjReturn });
  } catch (error) {
    res.status(422).json(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
exports.deleteComplaint = (req, res, next) => {
  const complaintId = req.params.complaintId;
  const userId = req.params.userId;

  Complaint.findById(complaintId)
    .then(complaint => {
      if (!complaint) {
        const error = new Error("Denúncia não encontrada!");
        error.statusCode = 404;
        throw error;
      }
      if (complaint.imageURL) clearImage(complaint.imageURL);
      return Complaint.findByIdAndRemove(complaintId);
    })
    .then(result => {
      const user = User.findById(userId);
      return user;
    })
    .then(user => {
      user.complaints.pull(complaintId);
      return user.save();
    })
    .then(result => {
      io.getIO().emit("complaints", {
        action: "delete",
        complaintID: complaintId
      });
      res.status(200).json({ message: "Denúncia removida!" });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.isInSphere = (req, res, next) => {
  const latitude = req.params.latitude;
  const longitude = req.params.longitude;

  Complaint.find({
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], 1 / 6378.1]
      }
    }
  })
    .count()
    .then(numberCases => {
      res.status(200).json({ message: "Success", numberCases: numberCases });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
