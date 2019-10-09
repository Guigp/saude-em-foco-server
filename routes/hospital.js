const express = require("express");
const Hospital = require("../models/hospital");
const hospitalController = require("../controllers/hospital");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/getHospitals", isAuth, hospitalController.getHospitals);

router.put("/setWaitingTime", isAuth, hospitalController.setWaitingTime);

router.post("/indication", isAuth, hospitalController.indication);

module.exports = router;
