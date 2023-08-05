// const express = require("express");
const app = require("express")();
const express = require("express");
const PORT = process.env.PORT || 4001;
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");
const post = require("./models/post");

//* to encrypt the password
var bcrypt = require("bcryptjs");
//* cookies
const cookieParser = require("cookie-parser");
//* jwt to handle the register/login store and verification
const jwt = require("jsonwebtoken");
//* a randon secret string for salt hashing pwd
const secret = "randomsecretstring";
//** to grab file input data from data and send to /upload folder
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });

//* filesystem to rename the binary file
const fs = require("fs");
const PostModel = require("./models/post");
const { pathToFileURL } = require("url");
const path = require("path");

//* handle CORS error by specifying the origin of requests
let corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
// pass cors options to middleware
app.use(cors(corsOptions));
// specify to parse json file
app.use(express.json());
// add cookies to middleware
app.use(cookieParser());
// serves static files from /uploads folder
app.use("/uploads", express.static(__dirname + "/uploads"));

(() =>
  mongoose
    .connect(
      "mongodb+srv://maebrie2017:V1vdnsKliMI20L4Y@cluster0.seyv8yp.mongodb.net/?retryWrites=true&w=majority"
    )
    .then(() => {
      console.log("database connected successfully");
    })
    .catch(() => {
      console.log("Failed to connect to database");
    }))();

app.post("/register", async (req, res) => {
  const { fullName, username, password, acceptedTerms } = req.body;
  try {
    const userData = await User.create({
      fullName,
      username,
      password: bcrypt.hashSync(password, 8),
      acceptedTerms,
    });
    // console.log(userData);
    res.json(JSON.stringify(userData));
  } catch (e) {
    console.log(e);
  }
});

app.post("/login", async (req, res) => {
  if (req.body.password && req.body.username) {
    const { username, password, acceptedTerms } = req.body;
    //* find one record in the database with the key username
    const userDoc = await User.findOne({ username });
    //*encrypt the password
    const checkPwd = bcrypt.compareSync(password, userDoc.password);
    const user = { username, id: userDoc._id };
    //* need of the token JWT  jsonwebtoken
    if (checkPwd) {
      // user loggin
      //* we create the jwt token with user payload
      jwt.sign(user, secret, {}, (err, token) => {
        if (err) throw err;
        //* need to send back the token as a cookie to client (browser)
        res.cookie("token", token).json(user);
      });
    } else {
      res.status(400).json({ msg: "Wrong credentials" });
    }
  }
});

// the objective here is to identify the person connected and print his name on the navbar place.
app.get("/profile", (req, res) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:5173");
  const { token } = req.cookies;
  try {
    //* verify the authenticity of the logger(user)
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token.",
        });
      } else {
        return res.json(info);
      }
    });
  } catch (e) {
    console.log(e);
  }
});

app.post("/logout", function (req, res) {
  //* we cancel the link or we drop the authentication in client side.
  res.cookie("token", "").json("logout OK");
});

// need to grad the file input data from form data and add extension before store it to uploads folder
app.post(
  "/post",
  uploadMiddleware.single("avatar"),
  cors(corsOptions),
  async (req, res) => {
    // input type file comme in req.file instead of req.body
    console.log(req.file);
    const { originalname, path } = req.file;
    const ext = originalname.split(".")[1];

    //the new path(name of file) to make the image readable
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;

    // verify the authenticity of the logger(user)
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token.",
        });
      }
      const { title, summary, content } = req.body;
      const postDoc = await post.create({
        title,
        summary,
        content,
        cover: newPath,
        created: true,
        author: info.id,
      });
      return res.json(postDoc);
    });
  }
);

// *get all the posts
app.get("/post", async (req, res) => {
  res.json(
    await post
      .find()
      .populate("author", ["username"])
      .sort({ create_at: -1 })
      .limit(20)
  );
});

//*get single post
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  console.log("done");
  try {
    const postDoc = await post.findById(id).populate("author", ["username"]);
    res.json(postDoc);
  } catch (error) {
    console.log(`Failed to find the post with id ${id}`);
    res.json({ error: `Failed to find the post with id ${id}` });
  }
});

//* update a post
app.put(
  "/post",
  uploadMiddleware.single("avatar"),
  cors(corsOptions),
  async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split(".")[1];
      newPath = path + "." + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    // verify the authenticity of the logger(user)
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token.",
        });
      }
      const { id, title, summary, content } = req.body;
      const postDoc = await post.findById(id);
      if (!(JSON.stringify(postDoc.author) === JSON.stringify(info.id))) {
        return res.status(400).json({ Error: "Not Authentic Author" });
      }
      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
        updated: true,
      });
      return res.json(postDoc);
    });
  }
);

app.listen(PORT, () => console.log(`server is listening to port ${PORT}`));
