const mongoose = require("mongoose");

const database = async () =>{
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB");
}

module.exports = database;