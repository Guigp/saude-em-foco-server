const express = require("express");
const { body } = require("express-validator/check");
const Complaint = require("../models/complaint");

const complaintController = require("../controllers/aedes");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.post("/addComplaint", isAuth, complaintController.addComplaint);

router.get("/getComplaints", isAuth, complaintController.getComplaints);
router.get(
  "/isInSphere/:latitude/:longitude",
  isAuth,
  complaintController.isInSphere
);
router.delete(
  "/deleteComplaint/:userId/:complaintId",
  isAuth,
  complaintController.deleteComplaint
);

module.exports = router;
