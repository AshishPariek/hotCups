import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import fs from "fs";

const app = express();
const port = 4500;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use("/static", express.static("images"));

const mydb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotcup_db",
});

app.get("/hotcup/allshops", (req, res) => {
  const sqlGet = "select * from coffee_shop";
  mydb.query(sqlGet, (err, result) => {
    err ? console.log("Error : ", err) : console.log("allshops ok");
    res.send(result);
  });
});

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

app.post("/hotcup/admin/deleteproduct", (req, res) => {
  const sqlDelete = "delete from coffee_shop where id=?";
  const { id } = req.body;
  mydb.query(sqlDelete, id, (err, result) => {
    if (err) {
      console.log("Error :", err);
    } else {
      const sqlCheck = "select image from coffee_shop where id=?";
      mydb.query(sqlCheck, id, (err, result) => {
        err
          ? console.log(err)
          : fs.unlink(`./images/${result[0].image}`, (err) => {
              console.log("Error Occured :", err);
            });
      });
    }
  });
});

app.listen(port, () => {
  console.log("Server Running at Port : ", port);
});
