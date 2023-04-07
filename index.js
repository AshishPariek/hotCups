import express from "express";
import cors from "cors";
import mysql from "mysql2";
import bcrypt, { compareSync } from "bcrypt";
import multer from "multer";
import fs from "fs";
import jwt from "jsonwebtoken";

const app = express();
const port = 4500;
const secretKey = "doNotShare";

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// MiddleWares
app.use(cors());
app.use(express.json());
app.use("/static", express.static("images"));

//DataBase
const mydb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotcup_db",
});

// Show All Shops API
app.get("/hotcup/allshops", (req, res) => {
  const sqlGet = "select * from coffee_shop";
  mydb.query(sqlGet, (err, result) => {
    err ? console.log("Error : ", err) : console.log("allshops ok");
    res.send(result);
  });
});

// Single  Shop API
app.post("/hotcup/shop", (req, res) => {
  const sqlPost = "update coffee_shop set likes=?, dislikes=? where id=?";
  const { likes, dislikes, id } = req.body;
  mydb.query(sqlPost, [likes, dislikes, id], (err, result) => {
    err ? console.log("Error", err) : console.log("feedback ok");
  });
  const sqlFeedback = "select likes,dislikes from coffee_shop where id=?";
  mydb.query(sqlFeedback, id, (err, result) => {
    err ? console.log("Error ", err) : console.log("feedbackSend ok");
    res.send(result);
  });
});

// Add Shop API
app.post("/hotcup/admin/addproduct", upload.single("shopImage"), (req, res) => {
  const sqlInsert =
    "insert into coffee_shop (name,image,parent_company,email,contact_number,address) values(?,?,?,?,?,?)";
  const { name, shopImageName, parentCompany, email, contactNumber, address } =
    req.body;
  mydb.query(
    sqlInsert,
    [name, shopImageName, parentCompany, email, contactNumber, address],
    (err, result) => {
      err ? console.log("Error : ", err) : console.log("addProduct ok");
      res.send("Product added");
    }
  );
});

// Delete Shop
app.post("/hotcup/admin/deleteproduct", (req, res) => {
  const sqlDelete = "delete from coffee_shop where id=?";
  const { id } = req.body;
  const sqlCheck = "select image from coffee_shop where id=?";
  mydb.query(sqlCheck, id, (err, result) => {
    console.log("imagetodelete", result[0]?.image);
    err
      ? console.log(err)
      : fs.unlink(`./images/${result[0]?.image}`, (err) => {
          console.log("Error Occured :", err);
        });
  });
  mydb.query(sqlDelete, id, (err, result) => {
    err ? console.log("Error :", err) : console.log("Delete ok");
  });
});

// Admin Register API
app.post("/hotcup/admin/register", (req, res) => {
  const sqlPost = "insert into users (name,email,password) values(?,?,?)";
  const { name, email, password } = req.body;
  const sqlCheck = "select email from users where email=?";
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  mydb.query(sqlCheck, email, (err, result) => {
    err ? console.log("Error :", err) : console.log("rgstr ok");
    if (result[0]?.email === email) {
      res.send("0");
    } else {
      mydb.query(sqlPost, [name, email, hashedPassword], (err, result) => {
        err ? console.log("Error", err) : console.log("Register Ok");
      });
      res.send("1");
    }
  });
});

// Admin Login API
app.post("/hotcup/admin/login", (req, res) => {
  const sqlCheck = "select email,password,id from users where email=?";
  const { email, password } = req.body;
  mydb.query(sqlCheck, email, (err, result) => {
    err ? console.log("Error", err) : console.log("Login Ok");
    if (result[0]?.email === email) {
      const isPasswordMatched = bcrypt.compareSync(
        password,
        result[0].password
      );
      console.log(isPasswordMatched);
      if (isPasswordMatched) {
        jwt.sign({ id: result[0].id }, secretKey, (err, token) => {
          err ? console.log("Error :") : console.log("token ok");
          res.json({
            user: { id: result[0].id, email },
            auth: token,
            value: "1",
          });
        });
      } else {
        res.send({ value: "0" });
      }
    } else {
      res.send({ value: "-1" });
    }
  });
});

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== undefined) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
};

// Port
app.listen(port, () => {
  console.log("Server Running at Port : ", port);
});
