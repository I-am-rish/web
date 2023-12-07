const express = require("express");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//user routes
const user = require("./routes/userRoutes");

app.use("/api", user);

//middleware for err
app.use(errorMiddleware);

module.exports = app;
