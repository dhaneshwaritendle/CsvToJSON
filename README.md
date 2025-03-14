<h1>CsvToJson Convertor which stores values in postgresDB</h1>

This project provides an API endpoint to upload a CSV file, convert its content into JSON format,
I have concatenated  firstName and lastName into a single name field, and stored them in a PostgreSQL database.

TechStack
Node.js -backend framework
Express.js for building the api
Multer- for handling file uploads
pg - postgreSQL client for db operations

<h1>API endpoint</h1> 

POST /upload this endpoint accepts a csv file, processes it into JSON format, combines first name and last name into a name field, and stores it in the PostgreSQL db
Request 
Method : post
Content Type : multipart/form-data
body: file input with multipart/form-data format under the key file
Response :
![image](https://github.com/user-attachments/assets/7d7850ea-45ce-454e-8152-d15b83960d83)

<h1>Setting up Express and CORS</h1>
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

<h1>Run the application</h1>

```
//for backend
node csvtojson.js
```

```
//for frontend
cd client
npm start 
```

![image](https://github.com/user-attachments/assets/3ec34aff-e1f3-4f65-8ebf-e6866e56c547)
