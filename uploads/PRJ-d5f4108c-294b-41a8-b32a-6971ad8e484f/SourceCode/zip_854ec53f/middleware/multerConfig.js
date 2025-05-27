import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Upload Directories
const uploadDirs = [
  path.join(__dirname, "../uploads"),
  path.join(__dirname, "../uploads/Images"),
  path.join(__dirname, "../uploads/Thumbnails"),
  path.join(__dirname, "../uploads/SourceCode"),
  path.join(__dirname, "../uploads/Videos"), // New directory for videos
];

// Create Directories If They Don't Exist
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      cb(null, "uploads/Thumbnails/");
    } else if (file.fieldname === "images") {
      cb(null, "uploads/Images/");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/Videos/");
    } else {
      cb(null, "uploads/SourceCode/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for general files
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg"];
    const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/webm"];
    const allowedCodeTypes = [
      "application/zip",
      "text/plain",
      "application/javascript",
      "text/html",
      "text/css",
      "application/json",
    ];

    if (file.fieldname === "thumbnail") {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error("Thumbnail must be PNG, JPG, or JPEG"));
      }
      if (file.size > 1 * 1024 * 1024) {
        return cb(new Error("Thumbnail must be less than 1MB"));
      }
    } else if (file.fieldname === "images") {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error("Images must be PNG, JPG, or JPEG"));
      }
      if (file.size > 1 * 1024 * 1024) {
        return cb(new Error("Each image must be less than 1MB"));
      }
    } else if (file.fieldname === "video") {
      if (!allowedVideoTypes.includes(file.mimetype)) {
        return cb(new Error("Video must be MP4, MPEG, or WebM"));
      }
      if (file.size > 50 * 1024 * 1024) {
        return cb(new Error("Video must be less than 50MB"));
      }
    } else if (!allowedCodeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type for source code"));
    }

    cb(null, true);
  },
});

export default upload;