const app = require("./app");
const connectDataBase = require("./config/dataBase");
require("dotenv").config({ path: "./config/.env" });

//database connection
connectDataBase();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

//handling error
process.on("unhandledRejection", (err) => {
  console.log(`An error occurred ${err.message}`);
  server.close(() => process.exit(1));
});
