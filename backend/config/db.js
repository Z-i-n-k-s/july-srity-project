const mongoose = require("mongoose");
const AppError = require("../helpers/AppError");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new AppError(
      "MONGODB_URI is missing from the environment configuration.",
      503,
      "DATABASE_NOT_CONFIGURED"
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production",
  });

  return mongoose.connection;
}

module.exports = connectDB;
