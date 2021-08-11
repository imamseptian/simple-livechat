const express = require("express");
const auther = require("./routes/auth");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("./model/User");
const Message = require("./model/Message");
const bcrypt = require("bcryptjs");
const { check, body, validationResult } = require("express-validator");

const PORT = process.env.PORT || 4000;
const PORT_SOCKET = process.env.PORT || 8000;
const app = express();

const InitiateMongoServer = require("./config/mongo");

InitiateMongoServer();

// const allowedOrigins = ["http://localhost:3000"];
const allowedOrigins = ["https://react-livechat.vercel.app"];
const ayaya = "lettete";
const options = (cors.CorsOptions = {
  origin: allowedOrigins,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(options));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      path.parse(file.originalname).name +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * Math.pow(1024, 2 /* MBs*/) },
});

app.get("/", (req, res) => {
  res.json({ message: "API KU NONGMON" });
});

app.use("/user", auther);
app.post(
  `/api/upload`,
  upload.single("gambar"),
  check("email", "Email field is invalid, etc etc").isEmail(),

  async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors);
      const mypath = "./public/uploads/" + req.file.filename;
      if (fs.existsSync(mypath)) {
        // mypath exists
        console.log("exists:", mypath);
        // fs.unlinkSync(mypath);
      } else {
        console.log("DOES NOT exist:", mypath);
      }
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    // let finalImageURL =
    //   req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename;

    let user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      // avatar: req.file.filename,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    await user.save();
    res.status(200).json({
      message: "success create user",
      // image: finalImageURL,
    });

    // res.json({ image: finalImageURL });
  }
);

app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});
