import express from "express";
import cors from "cors";
import mysql from "mysql2";

const app = express();
const port = 4500;

app.use(cors());
app.use(express.json());
app.use("/static", express.static("images"));

const mydb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotcup_db",
});

app.get("/hotcup/shops", (req, res) => {
  const sqlGet = "select * from coffee_shop";
  mydb.query(sqlGet, (err, result) => {
    err ? console.log("Error : ", err) : console.log("ok");
    res.send(result);
  });
});

app.listen(port, () => {
  console.log("Server Running at Port : ", port);
});
