// // import express from "express";
// // import cors from "cors"
// // import multer from "multer";
// // import fs from "fs";
// // import path from "path";
// // import unzipper from "unzipper";
// // import { v4 as uuidv4 } from "uuid";
// // import { fileURLToPath } from "url";

// // import connectDB from "./dbConnection.js";
// // import User from "../backend/models/userSchema.js";
// // import Project from "../backend/models/projectSchema.js"
// // import { generateId } from "./utils.js";

// // const PORT = 5000;

// // const app = express();
// // app.use(cors());

// // connectDB();

// // app.use(express.json());

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // // Define Upload Directories
// // const uploadDirs = [
// //   path.join(__dirname, "uploads"),
// //   path.join(__dirname, "uploads/Images"),
// //   path.join(__dirname, "uploads/Thumbnails"),
// //   path.join(__dirname, "uploads/SourceCode"),
// // ];

// // // Create Directories If They Don't Exist
// // uploadDirs.forEach((dir) => {
// //   if (!fs.existsSync(dir)) {
// //     fs.mkdirSync(dir, { recursive: true });
// //   }
// // });

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     if (file.fieldname === 'thumbnail') {
// //       cb(null, 'uploads/Thumbnails/'); 
// //     } else if (file.fieldname === 'images') {
// //       cb(null, 'uploads/Images/'); 
// //     } else {
// //       cb(null, 'uploads/');
// //     }
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + path.extname(file.originalname)); 
// //   }
// // });

// // const upload = multer({
// //   storage: storage,
// //   limits: {
// //     fileSize: 100 * 1024 * 1024, // 100MB limit
// //   },
// //   fileFilter: (req, file, cb) => {
// //     const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
// //     const allowedCodeTypes = [
// //       'application/zip',
// //       'text/plain',
// //       'application/javascript',
// //       'text/html',
// //       'text/css',
// //       'application/json',
// //     ];

// //     if (file.fieldname === 'thumbnail') {
// //       if (!allowedImageTypes.includes(file.mimetype)) {
// //         return cb(new Error('Thumbnail must be PNG, JPG, or JPEG'));
// //       }
// //       if (file.size > 1 * 1024 * 1024) { // 1MB limit for thumbnails
// //         return cb(new Error('Thumbnail must be less than 1MB'));
// //       }
// //     }

// //     if (file.fieldname === 'images') {
// //       if (!allowedImageTypes.includes(file.mimetype)) {
// //         return cb(new Error('Images must be PNG, JPG, or JPEG'));
// //       }
// //       if (file.size > 1 * 1024 * 1024) { // 1MB limit for images
// //         return cb(new Error('Each image must be less than 1MB'));
// //       }
// //     }
// //     cb(null, true);
// //   },
// // });





// // app.post("/api/user/register", async (req, res) => {
// //   try {
// //     const { firstName,middleName,lastName, email, password,phone,userType, userCountry, state, city, pincode,collegeId,collegeName,role } = req.body;


// //     const existingUser = await User.findOne({ email});
// //     if (existingUser) {
// //       return res.status(400).json({ message: "User already exists" });
// //     }

// //     const userId = await generateId("user");

// //     const newUser = User({
// //       userId,
// //       firstName,
// //       middleName,
// //       lastName,
// //       email,
// //       password,
// //       phone,
// //       userType,
// //       userCountry,
// //       state,
// //       city,
// //       pincode,
// //       collegeDetails: [{ collegeId, collegeName }],
// //       role,
// //     });

// //     await newUser.save();
// //     res.status(201).json({ message: "User registered successfully", user: newUser });
// //   } catch (error) {
// //     res.status(500).json({ message: "Server Error", error: error.message });
// //   }
// // });

// // app.get("/api/user/:id", async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     const user = await User.findOne({ userId: id });

// //     if (!user) {
// //       return res.status(404).json({ message: "User not found" });
// //     }

// //     res.status(200).json(user);
// //   } catch (error) {
// //     res.status(500).json({ message: "Server Error", error: error.message });
// //   }
// // });

// // // Upload Project API
// // app.post("/api/project/upload",upload.fields([ { name: 'thumbnail', maxCount: 1 },{ name: 'images', maxCount: 5 },]),
// //   async (req, res) => {
// //     const { title, description, category, uploadedBy, price, collegeId, collegeName, tags, techStack, projectType } = req.body;
// //     console.log("Received files:", req.files);
// //     console.log("Received body:", req.body);
// //     if (!title || !description || !category || !uploadedBy || !price || !projectType) {
// //       return res.status(400).json({ message: "Missing required fields" });
// //     }

// //     try {
// //       const projectId =await generateId('project');
// //       const user = await User.exists({ userId: uploadedBy });

// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }

// //       // Store Uploaded Files
// //       const thumbnailUrl = req.files["thumbnail"]
// //         ? `/uploads/Thumbnails/${req.files["thumbnail"][0].filename}`
// //         : null;

// //       const imagesUrls = req.files["images"]
// //         ? req.files["images"].map((file) => `/uploads/Images/${file.filename}`)
// //         : [];

// //       let sourceCodeUrls = [];

// //       // Handle ZIP Files
// //       if (req.files["files"]) {
// //         const file = req.files["files"][0];
// //         const ext = path.extname(file.originalname);

// //         if (ext === ".zip") {
// //           const extractFolder = `uploads/SourceCode/${projectId}`;
// //           fs.mkdirSync(extractFolder, { recursive: true });

// //           await fs.createReadStream(file.path)
// //             .pipe(unzipper.Extract({ path: extractFolder }))
// //             .promise();

// //           fs.unlinkSync(file.path); // Delete ZIP file after extraction

// //           // Rename extracted files uniquely
// //           const extractedFiles = fs.readdirSync(extractFolder);
// //           extractedFiles.forEach((f) => {
// //             const oldPath = path.join(extractFolder, f);
// //             const newFileName = `${uuidv4()}_${f}`;
// //             const newPath = path.join(extractFolder, newFileName);
// //             fs.renameSync(oldPath, newPath);
// //             sourceCodeUrls.push(`/uploads/SourceCode/${projectId}/${newFileName}`);
// //           });
// //         } else {
// //           // If not a ZIP, store the single file
// //           const uniqueFileName = `${uuidv4()}${ext}`;
// //           const newFilePath = `uploads/SourceCode/${uniqueFileName}`;
// //           fs.renameSync(file.path, newFilePath);
// //           sourceCodeUrls.push(`/uploads/SourceCode/${uniqueFileName}`);
// //         }
// //       }

// //       // Save to Database
// //       const newProject = new Project({
// //         projectId,
// //         title,
// //         description,
// //         category,
// //         uploadedBy,
// //         price,
// //         tags,
// //         techStack,
// //         projectType,
// //         collegeDetails: { collegeId, collegeName },
// //         thumbnail: thumbnailUrl,
// //         images: imagesUrls,
// //         files: sourceCodeUrls,
// //       });

// //       await newProject.save();

// //       res.status(201).json({ message: "Project uploaded successfully!", project: newProject });
// //     } catch (error) {
// //       console.error(error);

// //       // Cleanup on Error
// //       const uploadedPaths = [
// //         ...(req.files["thumbnail"] || []).map((f) => f.path),
// //         ...(req.files["images"] || []).map((f) => f.path),
// //         ...(req.files["files"] || []).map((f) => f.path),
// //       ];
// //       uploadedPaths.forEach((path) => fs.existsSync(path) && fs.unlinkSync(path));

// //       res.status(500).json({ message: "Error uploading project. All uploaded files have been deleted." });
// //     }
// //   }
// // );

// // app.get("/api/project/search", async (req, res) => {
// //   try {
// //     const { projectId, userId, collegeName, category, keyword } = req.query;
// //     let filter = {};

// //     if (projectId && userId) {
// //       filter = { projectId, uploadedBy: userId };
// //     } else {
// //       if (projectId) filter.projectId = projectId;
// //       if (userId) filter.uploadedBy = userId;
// //       if (collegeName) filter["collegeDetails.collegeName"] = collegeName;
// //       if (category) filter.category = { $regex: `\\b${category}\\b`, $options: "i" };
// //       if (keyword) {
// //         filter.$or = [
// //           { title: { $regex: `\\b${keyword}\\b`, $options: "i" } },
// //           { description: { $regex: `\\b${keyword}\\b`, $options: "i" } }
// //         ];
// //       }
// //     }

// //     const projects = await Project.find(filter);

// //     if (projects.length === 0) {
// //       return res.status(404).json({ message: "No projects found" });
// //     }

// //     res.json(projects);
// //   } catch (error) {
// //     res.status(500).json({ message: "Server Error", error: error.message });
// //   }
// // });



// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });
// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import path from 'path';
// import multer from 'multer';
// import { fileURLToPath } from 'url';
// import connectDB from './config/db.js';

// // Import routes
// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import projectRoutes from './routes/projectRoutes.js';

// // Initialize app
// const app = express();
// const PORT = 5000; // Hardcoded port

// // Connect to database
// connectDB();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ limit: '200mb', extended: true }));
// app.use(cors());

// // Serve static files
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/projects', projectRoutes);

// // Root route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// // Multer error handling middleware
// const multerErrorHandler = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({
//       success: false,
//       message: `Multer Error: ${err.message}`,
//     });
//   }
//   next(err);
// };

// // General error handling middleware
// app.use((err, req, res, next) => {
//   console.error("Error:", {
//     message: err.message,
//     stack: err.stack,
//     path: req.path,
//     method: req.method,
//   });
//   res.status(500).json({
//     success: false,
//     message: 'Server Error',
//     error: 'An error occurred', // Hardcoded for development
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// export default app;


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from './config/passportConfig.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000; 

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(cors());
app.use(session({
  secret: 'your_session_secret', 
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Multer error handling middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Multer Error: ${err.message}`,
    });
  }
  next(err);
};

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: 'An error occurred', 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;