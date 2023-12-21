const mongoose = require("mongoose");

const connectDataBase = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`DataBase is connected on port ${data.connection.port}`);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = connectDataBase;
