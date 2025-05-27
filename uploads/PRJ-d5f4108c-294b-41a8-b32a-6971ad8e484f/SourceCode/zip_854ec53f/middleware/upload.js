import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

// Get the current directory name for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for all uploads
const UPLOADS_BASE_DIR = path.join(__dirname, "../Uploads");

// Ensure necessary directories exist, otherwise create them
const ensureDirectoryExistence = async (filePath) => {
  const dirname = path.dirname(filePath);
  try {
    if (!existsSync(dirname)) {
      await fs.mkdir(dirname, { recursive: true });
      console.log(`Created directory: ${dirname}`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to create directory ${dirname}: ${err.message}`);
    throw new Error(`Failed to create directory: ${dirname}`);
  }
};

// Configure storage for multer with project ID organization
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const projectId = req.body.projectId || "temp";
      let uploadPath;

      switch (file.fieldname) {
        case "thumbnail":
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Thumbnails");
          break;
        case "images":
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Images");
          break;
        case "video":
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Videos");
          break;
        case "sourceCode":
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "SourceCode");
          break;
        case "otherFiles":
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "OtherFiles");
          break;
        default:
          uploadPath = path.join(UPLOADS_BASE_DIR, projectId, "Other");
      }

      await ensureDirectoryExistence(uploadPath);
      console.log(`Preparing to save ${file.fieldname} file ${file.originalname} to ${uploadPath}`);
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

  if (file.fieldname === "thumbnail") {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Thumbnail must be PNG, JPG, JPEG, or WebP"), false);
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

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 17, // Max: 1 thumbnail + 10 images + 1 video + 1 sourceCode + 5 otherFiles
  },
  fileFilter: fileFilter,
});

// Error handling middleware for multer
export const handleUploadError = async (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    await cleanupTempFiles(req.files);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds limit (100MB max)" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files uploaded (17 max)" });
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

// Middleware for uploading project media
export const uploadProjectMedia = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
  { name: "sourceCode", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 },
]);

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
        if (await fs.stat(filePath).catch(() => false)) {
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