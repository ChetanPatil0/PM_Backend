// config/db.js
import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://chetan:Mangal000@chetan.7b6tv.mongodb.net/?retryWrites=true&w=majority&appName=chetan";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Atlas Connected...");
  } catch (error) {
    console.error("MongoDB Atlas Connection Failed:", error);
    process.exit(1);
  }
};

export default connectDB;
