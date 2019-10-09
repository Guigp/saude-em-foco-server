const path = require("path");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaint");
const hospitalRoutes = require("./routes/hospital");
const commentRoutes = require("./routes/comment");
const keys = require("./config/keys");

const multer = require("multer");
const uuid = require("uuidv4");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuid() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(hospitalRoutes);
app.use(authRoutes);
app.use(complaintRoutes);
app.use(commentRoutes);

app.use((error, req, res, next) => {
  console.log("ERRO EM MIDDLEWARE", error);
  const status = error.statusCode || 500;

  res.status(status).json({ message: error.message });
});

mongoose
  .connect(keys.mongoURI, { useNewUrlParser: true })

  .then(result => {
    const PORT = process.env.PORT || 8080;
    console.log("PORT:", PORT);
    const server = app.listen(PORT);
    const io = require("./socket").init(server);
    io.on("connection", socket => {
      console.log("Cliente conectado!");
    });
  })
  .catch(err => console.log(err));
