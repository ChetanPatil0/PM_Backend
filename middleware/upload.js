// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs/promises";
// import { existsSync, mkdirSync } from "fs";
// import { v4 as uuidv4 } from "uuid";

// // Get the current directory name for file paths
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Base directory for all uploads
// const UPLOADS_BASE_DIR = path.join(__dirname, "../Uploads");

// // Ensure necessary directories exist, otherwise create them
// const ensureDirectoryExistence = async (dirPath) => {
//   console.log(`Attempting to ensure directory: ${dirPath}`);
//   try {
//     if (!existsSync(dirPath)) {
//       console.log(`Directory ${dirPath} does not exist, creating...`);
//       // Using sync version to ensure directory exists before proceeding
//       mkdirSync(dirPath, { recursive: true });
//       console.log(`Created directory: ${dirPath}`);
//     } else {
//       console.log(`Directory ${dirPath} already exists`);
//     }
//     return true;
//   } catch (err) {
//     console.error(`Failed to create directory ${dirPath}: ${err.message}`);
//     throw new Error(`Failed to create directory: ${dirPath}`);
//   }
// };

// // Configure storage for multer with project ID organization
// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     try {
//       // Use unique temp directory if projectId is missing
//       const projectId = req.body.projectId || `PRJ-${uuidv4()}`;
      
//       // Store the projectId for later use
//       if (!req.body.projectId) {
//         req.body.projectId = projectId;
//       }
      
//       let uploadPath;

//       switch (file.fieldname) {
//         case "thumbnail":
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Thumbnails");
//           break;
//         case "images":
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Images");
//           break;
//         case "video":
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Videos");
//           break;
//         case "sourceCode":
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "SourceCode");
//           break;
//         case "otherFiles":
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "OtherFiles");
//           break;
//         default:
//           uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Other");
//       }

//       console.log(`Ensuring directory for ${file.fieldname}: ${uploadPath}`);
      
//       // Using sync version to ensure directory exists before proceeding to next step
//       if (!existsSync(uploadPath)) {
//         mkdirSync(uploadPath, { recursive: true });
//         console.log(`Created directory structure: ${uploadPath}`);
//       }
      
//       console.log(`Saving ${file.fieldname} file ${file.originalname} to ${uploadPath}`);
//       cb(null, uploadPath);
//     } catch (err) {
//       console.error(`Error setting destination for ${file.originalname}: ${err.message}`);
//       cb(err);
//     }
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const uniqueFilename = `${Date.now()}-${uuidv4()}${ext}`;
//     console.log(`Generated filename for ${file.originalname}: ${uniqueFilename}`);
//     cb(null, uniqueFilename);
//   },
// });

// // File filter for validating allowed file types
// const fileFilter = (req, file, cb) => {
//   const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
//   const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"];
//   const allowedZipTypes = ["application/zip", "application/x-zip-compressed"];
//   const allowedOtherFileTypes = [
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     "text/plain",
//     "application/javascript",
//     "text/javascript",
//     "text/html",
//     "text/css",
//   ];

//   console.log(`Validating file ${file.originalname} for field ${file.fieldname}, mimetype: ${file.mimetype}`);

//   if (file.fieldname === "thumbnail") {
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(new Error("Thumbnail must be PNG, JPG, JPEG, or WebP"), false);
//     }
//   } else if (file.fieldname === "images") {
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(new Error("Images must be PNG, JPG, JPEG, or WebP"), false);
//     }
//   } else if (file.fieldname === "video") {
//     if (!allowedVideoTypes.includes(file.mimetype)) {
//       return cb(new Error("Video must be MP4, MPEG, QuickTime, or WebM"), false);
//     }
//   } else if (file.fieldname === "sourceCode") {
//     if (!allowedZipTypes.includes(file.mimetype) && !file.originalname.toLowerCase().endsWith(".zip")) {
//       return cb(new Error("Source code must be a ZIP file"), false);
//     }
//   } else if (file.fieldname === "otherFiles") {
//     if (
//       !allowedOtherFileTypes.includes(file.mimetype) &&
//       !file.originalname.match(/\.(pdf|doc|docx|txt|js|html|css)$/i)
//     ) {
//       return cb(new Error("Other files must be PDF, DOC, DOCX, TXT, JS, HTML, or CSS"), false);
//     }
//   }

//   cb(null, true);
// };

// // Ensure the main uploads directory exists at startup
// const ensureUploadsBaseDir = () => {
//   if (!existsSync(UPLOADS_BASE_DIR)) {
//     console.log(`Creating base uploads directory: ${UPLOADS_BASE_DIR}`);
//     mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
//   }
// };

// // Call this immediately to ensure base directory exists
// ensureUploadsBaseDir();

// // Create multer upload instance
// export const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB max file size
//     files: 17, // Max: 1 thumbnail + 10 images + 1 video + 1 sourceCode + 5 otherFiles
//   },
//   fileFilter: fileFilter,
// }).fields([
//   { name: "thumbnail", maxCount: 1 },
//   { name: "images", maxCount: 10 },
//   { name: "video", maxCount: 1 },
//   { name: "sourceCode", maxCount: 1 },
//   { name: "otherFiles", maxCount: 5 },
// ]);

// // Middleware to set projectId before Multer
// export const setProjectId = async (req, res, next) => {
//   try {
//     if (!req.body.projectId) {
//       const projectId = `Project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
//       req.body.projectId = projectId;
//       console.log(`Generated projectId for Multer: ${projectId}`);
//     }
//     next();
//   } catch (err) {
//     console.error(`Error setting projectId: ${err.message}`);
//     res.status(500).json({ message: "Failed to set project ID" });
//   }
// };

// // Error handling middleware for multer
// export const handleUploadError = async (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     console.error("Multer error:", err);
//     await cleanupTempFiles(req.files);
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({ message: "File size exceeds limit (100MB max)" });
//     }
//     if (err.code === "LIMIT_FILE_COUNT") {
//       return res.status(400).json({ message: "Too many files uploaded (17 max)" });
//     }
//     if (err.code === "LIMIT_UNEXPECTED_FILE") {
//       return res.status(400).json({ message: `Unexpected field: ${err.field}` });
//     }
//     return res.status(400).json({ message: `Upload error: ${err.message}` });
//   } else if (err) {
//     console.error("General upload error:", err);
//     await cleanupTempFiles(req.files);
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// // Middleware for uploading project media
// export const uploadProjectMedia = upload;

// // Function to clean up temporary files on error
// export const cleanupTempFiles = async (files) => {
//   if (!files) {
//     console.log("No files to clean up");
//     return;
//   }

//   for (const fieldname in files) {
//     for (const file of files[fieldname]) {
//       try {
//         const filePath = file.path;
//         console.log(`Checking temp file: ${filePath}`);
//         if (existsSync(filePath)) {
//           await fs.unlink(filePath);
//           console.log(`Cleaned up temp file: ${filePath}`);
//         } else {
//           console.log(`Temp file not found, skipping: ${filePath}`);
//         }
//       } catch (err) {
//         console.error(`Failed to delete temp file ${file.path}: ${err.message}`);
//       }
//     }
//   }
// };




import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from "uuid";

// Get the current directory name for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for all uploads
const UPLOADS_BASE_DIR = path.join(__dirname, "../Uploads");

// Ensure necessary directories exist, otherwise create them
const ensureDirectoryExistence = async (dirPath) => {
  console.log(`Attempting to ensure directory: ${dirPath}`);
  try {
    if (!existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist, creating...`);
      mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    } else {
      console.log(`Directory ${dirPath} already exists`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to create directory ${dirPath}: ${err.message}`);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
};

// Configure storage for multer with project ID or user ID organization
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Use unique temp ID if projectId or userId is missing
      const id = file.fieldname === "profilePicture" ? (req.user?.id || req.params.userId || `USR-${uuidv4()}`) : (req.body.projectId || `PRJ-${uuidv4()}`);
      
      // Store the ID for later use
      if (file.fieldname === "profilePicture" && !req.body.userId && req.user?.id) {
        req.body.userId = req.user.id;
      } else if (!req.body.projectId && file.fieldname !== "profilePicture") {
        req.body.projectId = id;
      }
      
      let uploadPath;

      switch (file.fieldname) {
        case "thumbnail":
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "Thumbnails");
          break;
        case "images":
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "Images");
          break;
        case "video":
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "Videos");
          break;
        case "sourceCode":
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "SourceCode");
          break;
        case "otherFiles":
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "OtherFiles");
          break;
        case "profilePicture":
          uploadPath = path.join(UPLOADS_BASE_DIR, "ProfilePictures", id);
          break;
        default:
          uploadPath = path.join(UPLOADS_BASE_DIR, id, "Other");
      }

      console.log(`Ensuring directory for ${file.fieldname}: ${uploadPath}`);
      
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
        console.log(`Created directory structure: ${uploadPath}`);
      }
      
      console.log(`Saving ${file.fieldname} file ${file.originalname} to ${uploadPath}`);
      cb(null, uploadPath);
    } catch (err) {
      console.error(`Error setting destination for ${file.originalname}: ${err.message}`);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${Date.now()}-${uuidv4()}${ext}`;
    console.log(`Generated filename for ${file.originalname}: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  },
});

// File filter for validating allowed file types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"];
  const allowedZipTypes = ["application/zip", "application/x-zip-compressed"];
  const allowedOtherFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/javascript",
    "text/javascript",
    "text/html",
    "text/css",
  ];

  console.log(`Validating file ${file.originalname} for field ${file.fieldname}, mimetype: ${file.mimetype}`);

  if (file.fieldname === "thumbnail" || file.fieldname === "profilePicture") {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error(`${file.fieldname === "thumbnail" ? "Thumbnail" : "Profile picture"} must be PNG, JPG, JPEG, or WebP`), false);
    }
  } else if (file.fieldname === "images") {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Images must be PNG, JPG, JPEG, or WebP"), false);
    }
  } else if (file.fieldname === "video") {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(new Error("Video must be MP4, MPEG, QuickTime, or WebM"), false);
    }
  } else if (file.fieldname === "sourceCode") {
    if (!allowedZipTypes.includes(file.mimetype) && !file.originalname.toLowerCase().endsWith(".zip")) {
      return cb(new Error("Source code must be a ZIP file"), false);
    }
  } else if (file.fieldname === "otherFiles") {
    if (
      !allowedOtherFileTypes.includes(file.mimetype) &&
      !file.originalname.match(/\.(pdf|doc|docx|txt|js|html|css)$/i)
    ) {
      return cb(new Error("Other files must be PDF, DOC, DOCX, TXT, JS, HTML, or CSS"), false);
    }
  }

  cb(null, true);
};

// Ensure the main uploads directory exists at startup
const ensureUploadsBaseDir = () => {
  if (!existsSync(UPLOADS_BASE_DIR)) {
    console.log(`Creating base uploads directory: ${UPLOADS_BASE_DIR}`);
    mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
  }
};

// Call this immediately to ensure base directory exists
ensureUploadsBaseDir();

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 17, // Max: 1 thumbnail + 10 images + 1 video + 1 sourceCode + 5 otherFiles
  },
  fileFilter: fileFilter,
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
  { name: "sourceCode", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 },
  { name: "profilePicture", maxCount: 1 },
]);

// Middleware to set projectId or userId before Multer
export const setProjectId = async (req, res, next) => {
  try {
    if (!req.body.projectId && !req.body.userId) {
      const id = `Project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      req.body.projectId = id;
      console.log(`Generated projectId for Multer: ${id}`);
    }
    next();
  } catch (err) {
    console.error(`Error setting projectId: ${err.message}`);
    res.status(500).json({ message: "Failed to set project ID" });
  }
};

// Middleware for uploading project media
export const uploadProjectMedia = upload;

// Middleware for uploading profile picture
export const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB max for profile picture
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Profile picture must be PNG, JPG, JPEG, or WebP"), false);
    }
    cb(null, true);
  },
}).single("profilePicture");

// Middleware for uploading user files
export const uploadUserMedia = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = [
      "image/png", "image/jpg", "image/jpeg", "image/webp",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "application/javascript", "text/javascript",
      "text/html", "text/css", "application/zip"
    ];
    if (!allowedFileTypes.includes(file.mimetype)) {
      return cb(new Error("User files must be PNG, JPG, JPEG, WebP, PDF, DOC, DOCX, TXT, JS, HTML, CSS, or ZIP"), false);
    }
    cb(null, true);
  },
}).array("userFiles", 5);

// Error handling middleware for multer
export const handleUploadError = async (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    await cleanupTempFiles(req.files);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `File size exceeds limit (${err.field === "profilePicture" ? "1MB" : "100MB"} max)` });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files uploaded (17 max for projects, 5 max for user files, 1 for profile picture)" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: `Unexpected field: ${err.field}` });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    console.error("General upload error:", err);
    await cleanupTempFiles(req.files);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Function to clean up temporary files on error
export const cleanupTempFiles = async (files) => {
  if (!files) {
    console.log("No files to clean up");
    return;
  }

  for (const fieldname in files) {
    for (const file of files[fieldname]) {
      try {
        const filePath = file.path;
        console.log(`Checking temp file: ${filePath}`);
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
          console.log(`Cleaned up temp file: ${filePath}`);
        } else {
          console.log(`Temp file not found, skipping: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete temp file ${file.path}: ${err.message}`);
      }
    }
  }
};