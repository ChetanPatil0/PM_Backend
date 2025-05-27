// import jwt from "jsonwebtoken";
// import crypto from "crypto";
// import User from "../models/userModel.js";

// // Secure hardcoded secret (use strong random string or passphrase)
// const JWT_SECRET = crypto
//   .createHash("sha256")
//   .update("super_secure_custom_passphrase_!@#123")
//   .digest("hex");


// export const generateToken = (userId, identifier, role) => {
//   return jwt.sign(
//     { 
//       userId,
//       identifier,
//       role 
//     },
//     JWT_SECRET,
//     { expiresIn: '1d' }
//   );
// };

// /**
//  * Middleware to verify JWT token with flexible user identification
//  */
// export const auth = async (req, res, next) => {
//   try {
//     // Get token from Authorization header
//     const authHeader = req.header("Authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token, authorization denied" });
//     }

//     const token = authHeader.replace("Bearer ", "").trim();

//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET);

//     // Find user by multiple potential identifiers
//     const user = await User.findOne({
//       $or: [
//         { _id: decoded.userId },           // Primary check by _id
//         { mobile: decoded.identifier },    // Secondary check by mobile
//         { email: decoded.identifier },     // Tertiary check by email
//         { userId: decoded.identifier }     // Check by custom userId
//       ]
//     });
    
//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // Add user to request object
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Auth middleware error:", error);

//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired" });
//     }

//     res.status(401).json({ 
//       message: "Invalid token", 
//       errorName: error.name,
//       errorMessage: error.message 
//     });
//   }
// };


import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { JWT_SECRET,TOKEN_EXPIRY } from "../config/constants.js";



// // Secure hardcoded secret (use strong random string or passphrase)
// const JWT_SECRET = crypto
//   .createHash("sha256")
//   .update("super_secure_custom_passphrase_!@#123")
//   .digest("hex");

/**
 * Generate JWT token for user authentication
 */
export const generateToken = (userId, identifier, role,EXPIRY=TOKEN_EXPIRY) => {
  return jwt.sign(
    { 
      userId,
      identifier,
      role 
    },
    JWT_SECRET,
    { expiresIn: EXPIRY || TOKEN_EXPIRY}
  );
};

/**
 * Middleware to verify JWT token with flexible user identification
 */
export const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Flexible user finding function
    const findUser = async () => {
      // If userId is a valid ObjectId, try finding by _id first
      if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
        const userById = await User.findById(decoded.userId);
        if (userById) return userById;
      }

      // If not found by _id, try finding by other identifiers
      return await User.findOne({
        $or: [
          { mobile: decoded.identifier },
          { email: decoded.identifier },
          { userId: decoded.identifier }
        ]
      });
    };

    // Find the user
    const user = await findUser();
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(401).json({ 
      message: "Invalid token", 
      errorName: error.name,
      errorMessage: error.message 
    });
  }
};