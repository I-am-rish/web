const app = require("./app");
const connectDataBase = require("./config/dataBase");
require("dotenv").config({ path: "./config/.env" });


//unhandled uncatch error
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting Down the Server due to uncaught Exception");
  process.exit(1);
});

//database connection
connectDataBase();

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

//unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`An error occurred ${err.message}`);
  server.close(() => process.exit());
}); 
