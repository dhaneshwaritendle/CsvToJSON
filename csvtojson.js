// const fs = require("fs");
const cors = require("cors");
const { Pool } = require("pg");
const express = require("express");
const multer = require("multer");
require("dotenv").config();

const app = express();
const port = 5000;
const upload = multer({storage:multer.memoryStorage() });

// Enable CORS for all requests
app.use(cors()); 

// psql connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//middleware to parse CSV file into json
const csvToJson = (req, res,next) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    try{
        const fileData = req.file.buffer.toString("utf8");
        const lines = fileData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        req.jsonData = [];
  
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(value => value.trim());
        if (values.length !== headers.length) continue; // skip incorrect rows

        let obj = {};
        headers.forEach((header, index) => {
            const keys = header.split(".");
            let temp = obj;

            for (let j = 0; j < keys.length - 1; j++) {
                temp[keys[j]] = temp[keys[j]] || {};
                temp = temp[keys[j]];
            }
            temp[keys[keys.length - 1]] = values[index].trim(); // assign value
        });

        // Concatenate firstName and lastName
        obj.name = `${obj.name?.firstName || ""} ${obj.name?.lastName || ""}`.trim();

        req.jsonData.push(obj);
        }
        next();
    }
    catch(error){
        console.error(error);
        return res.status(500).json({error: "failed to process csv file"});
    }
    
  };

// Store JSON in PostgreSQL
const storeInDB = async (req, res) => {
    if (!req.jsonData || req.jsonData.length === 0) {
        return res.status(400).json({ error: "No valid data to store" });
    }
  const client = await pool.connect();

  try {
    for (let user of req.jsonData) {
      await client.query(
        "INSERT INTO users (name, age, address, additional_info, gender) VALUES ($1, $2, $3, $4, $5)",
    [       user.name,  
            user.age, 
            JSON.stringify(user.address), 
            JSON.stringify(user.additional_info || {} ),
            user.gender,
    ]
         );
         console.log("User Data:", JSON.stringify(user, null, 2));
    }
    console.log(" Data successfully inserted into the database.");
    res.json({ message: "File uploaded and data stored successfully." });

  } catch (err) {
    console.error(" Error inserting data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } 
};


app.use(express.json());
app.post("/upload", upload.single("file"),csvToJson, storeInDB);
app.listen(port, ()=>{
    console.log(`server running on http://localhost:${port}`);
})
