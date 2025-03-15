<h1>CsvToJson Convertor which stores values in postgresDB</h1>

This project provides an API endpoint to upload a CSV file, convert its content into JSON format
Things to note are :

1• First line in the csv file will always be labels for the properties

2• Number of records in the file can go beyond 50000

3• You can have properties with infinite depth. (a.b.c.d........z.a1.b1.c1.....)

4• All sub-properties of a complex property will be placed next to each other in the file.

### TechStack  
- **Node.js** - Backend framework  
- **Express.js** - For building the API  
- **Multer** - To handle file uploads  
- **pg** - PostgreSQL client for DB operations  
- **pg-copy-streams** - Streaming data from CSV file to PostgreSQL using `COPY` command  

<h1>API endpoint</h1> 

POST /upload this endpoint accepts a csv file, processes it into JSON format, combines first name and last name into a name field, and stores it in the PostgreSQL db
Request 
Method : post
Content Type : multipart/form-data
body: file input with multipart/form-data format under the key file
Response :
![image](https://github.com/user-attachments/assets/95146055-d463-493b-a250-857956de24da)

<h1>Implementation</h1>

<h2>Setting up Express and CORS</h2>
To avoid CORS errors when sending requests from the frontend we need to enable cors in Express

```
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
```
<h2>Handling file upload and parsing CSV</h2>

Middleware to parse CSV into json
```
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

        // concatenate firstName and lastName
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
```
store json in postgresql db
```
// store JSON in PostgreSQL
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
    // console.log(" Data successfully inserted into the database.");
    res.json({ 
      message: "File uploaded and data stored successfully.",
      data: req.jsonData  // Include converted JSON response
     });

  } catch (err) {
    // console.error(" Error inserting data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } 
};
```

Dependencies 
```
npm install express cors pg dotenv multer
```
create .env file which contains
```
PORT=5000
DATABASE_URL=your_postgresql_connection
```
Run the application
for running server 
```
node csvtojson.js
```
for running frontend
```
cd client
npm start 
```
Sending Data from frontend using 'fetch' api
```
const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Upload Successful");
        setUploadedData(data); // Store response data to display
      } else {
        setMessage("Upload Failed ");
      }
    } catch (error) {
      setMessage("Upload Failed ");
    }
  };
```
<h1>How data is getting stored in PostgreSQL</h1>
Here we are using memorystorage to make insertions fast
For insertion of 50+ records we will use COPY  command 
Data is stored in the below format where name retains lastname and firstname properties by having json data type
Additional properties have properties such as gender added to it.
![image](https://github.com/user-attachments/assets/f12ca766-35c3-470f-acfc-cc1691b89fc9)
This is the output on the console for the following query : 
![image](https://github.com/user-attachments/assets/3ec34aff-e1f3-4f65-8ebf-e6866e56c547)
