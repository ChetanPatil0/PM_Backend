import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";
import unzipper from "unzipper";
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

// Function to handle ZIP file extraction
export const handleZipFile = async (file, projectId) => {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Valid project ID is required for ZIP extraction");
  }

  const extractedFilePaths = [];
  const filePath = file.path;

  try {
    console.log(`Processing ZIP file: ${file.originalname} for project: ${projectId}`);

    const extractDir = path.join(UPLOADS_BASE_DIR, projectId, "SourceCode");
    await ensureDirectoryExistence(extractDir);

    const zipId = uuidv4().substring(0, 8);
    const zipExtractDir = path.join(extractDir, `zip_${zipId}`);
    await ensureDirectoryExistence(zipExtractDir);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(unzipper.Extract({ path: zipExtractDir }))
        .on("error", (err) => {
          console.error(`ZIP extraction error: ${err.message}`);
          reject(err);
        })
        .on("finish", () => {
          console.log(`ZIP extraction complete to: ${zipExtractDir}`);
          resolve();
        });
    });

    try {
      if (await fs.stat(filePath).catch(() => false)) {
        await fs.unlink(filePath);
        console.log(`Removed original ZIP file: ${filePath}`);
      }
    } catch (unlinkError) {
      console.error(`Failed to remove original ZIP: ${unlinkError.message}`);
    }

    const processDir = async (dir, basePath = "") => {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.join(basePath, item.name);

        if (item.isDirectory()) {
          await processDir(fullPath, relativePath);
        } else {
          const urlPath = `/Uploads/${projectId}/SourceCode/zip_${zipId}/${relativePath.replace(/\\/g, "/")}`;
          extractedFilePaths.push(urlPath);
        }
      }
    };

    await processDir(zipExtractDir);
    console.log(`Processed ZIP with ${extractedFilePaths.length} files`);

    // Return the first file path or the ZIP directory path as a single string
    const sourceCodePath =
      extractedFilePaths.length > 0 ? extractedFilePaths[0] : `/Uploads/${projectId}/SourceCode/zip_${zipId}`;
    console.log(`Selected source code path: ${sourceCodePath}`);
    return sourceCodePath;
  } catch (error) {
    console.error(`Error handling ZIP file: ${error.message}`);

    try {
      const zipExtractDir = path.join(UPLOADS_BASE_DIR, projectId, "SourceCode", `zip_${zipId}`);
      if (existsSync(zipExtractDir)) {
        await fs.rm(zipExtractDir, { recursive: true });
        console.log(`Cleaned up failed ZIP extraction: ${zipExtractDir}`);
      }
    } catch (cleanupError) {
      console.error(`Error cleaning up failed extraction: ${cleanupError.message}`);
    }

    throw new Error(`Failed to process ZIP file: ${error.message}`);
  }
};

// Save thumbnail image
export const saveThumbnail = async (file, projectId) => {
  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueFileName = `${uuidv4()}${ext}`;

  const dir = projectId
    ? path.join(UPLOADS_BASE_DIR, `Thumbnails/${projectId}`)
    : path.join(UPLOADS_BASE_DIR, "Thumbnails");

  try {
    await ensureDirectoryExistence(dir);
    const newFilePath = path.join(dir, uniqueFileName);
    await fs.rename(filePath, newFilePath);
    const urlPath = projectId
      ? `/Uploads/Thumbnails/${projectId}/${uniqueFileName}`
      : `/Uploads/Thumbnails/${uniqueFileName}`;
    console.log(`Saved thumbnail ${file.originalname} to ${newFilePath} with URL: ${urlPath}`);
    return urlPath;
  } catch (error) {
    console.error(`Failed to save thumbnail ${file.originalname}: ${error.message}`);
    throw new Error(`Failed to save thumbnail: ${error.message}`);
  }
};

// Save project image
export const saveImage = async (file, projectId) => {
  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueFileName = `${uuidv4()}${ext}`;

  const dir = projectId
    ? path.join(UPLOADS_BASE_DIR, `Images/${projectId}`)
    : path.join(UPLOADS_BASE_DIR, "Images");

  try {
    await ensureDirectoryExistence(dir);
    const newFilePath = path.join(dir, uniqueFileName);
    await fs.rename(filePath, newFilePath);
    const urlPath = projectId ? `/Uploads/Images/${projectId}/${uniqueFileName}` : `/Uploads/Images/${uniqueFileName}`;
    console.log(`Saved image ${file.originalname} to ${newFilePath} with URL: ${urlPath}`);
    return urlPath;
  } catch (error) {
    console.error(`Failed to save image ${file.originalname}: ${error.message}`);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Save project video
export const saveVideo = async (file, projectId) => {
  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueFileName = `${uuidv4()}${ext}`;

  const dir = projectId
    ? path.join(UPLOADS_BASE_DIR, `Videos/${projectId}`)
    : path.join(UPLOADS_BASE_DIR, "Videos");

  try {
    await ensureDirectoryExistence(dir);
    const newFilePath = path.join(dir, uniqueFileName);
    await fs.rename(filePath, newFilePath);
    const urlPath = projectId ? `/Uploads/Videos/${projectId}/${uniqueFileName}` : `/Uploads/Videos/${uniqueFileName}`;
    console.log(`Saved video ${file.originalname} to ${newFilePath} with URL: ${urlPath}`);
    return urlPath;
  } catch (error) {
    console.error(`Failed to save video ${file.originalname}: ${error.message}`);
    throw new Error(`Failed to save video: ${error.message}`);
  }
};

// Save source code file (ZIP only)
export const saveSourceCode = async (file, projectId) => {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Valid project ID is required for source code");
  }

  if (!file.originalname.toLowerCase().endsWith(".zip")) {
    throw new Error("Source code must be a ZIP file");
  }

  const zipPath = await handleZipFile(file, projectId);
  console.log(`Saved ZIP source code ${file.originalname} with path: ${zipPath}`);
  return zipPath;
};

// Save other non-ZIP file
export const saveOtherFile = async (file, projectId) => {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Valid project ID is required for other files");
  }

  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueFileName = `${uuidv4()}${ext}`;

  const dir = path.join(UPLOADS_BASE_DIR, `OtherFiles/${projectId}`);
  try {
    await ensureDirectoryExistence(dir);
    const newFilePath = path.join(dir, uniqueFileName);
    await fs.rename(filePath, newFilePath);
    const urlPath = `/Uploads/OtherFiles/${projectId}/${uniqueFileName}`;
    console.log(`Saved other file ${file.originalname} to ${newFilePath} with URL: ${urlPath}`);
    return urlPath;
  } catch (error) {
    console.error(`Failed to save other file ${file.originalname}: ${error.message}`);
    throw new Error(`Failed to save other file: ${error.message}`);
  }
};

// Clean up files on error
export const cleanupFiles = async (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) {
    console.log("No file paths provided for cleanup");
    return;
  }

  for (const filePath of filePaths) {
    const tempPath = filePath.path || filePath;
    const finalPath =
      typeof filePath === "string" ? path.join(UPLOADS_BASE_DIR, filePath.replace(/^\/Uploads/, "Uploads")) : null;

    for (const p of [tempPath, finalPath].filter(Boolean)) {
      try {
        if (await fs.stat(p).catch(() => false)) {
          await fs.unlink(p);
          console.log(`Deleted file: ${p}`);
        } else {
          console.log(`File not found, skipping: ${p}`);
        }
      } catch (err) {
        console.error(`Failed to delete ${p}: ${err.message}`);
      }
    }
  }
};

// Ensure upload directories are created at startup
export const ensureUploadDirs = async () => {
  const uploadDirs = [
    path.join(UPLOADS_BASE_DIR, "Images"),
    path.join(UPLOADS_BASE_DIR, "Thumbnails"),
    path.join(UPLOADS_BASE_DIR, "Videos"),
    path.join(UPLOADS_BASE_DIR, "SourceCode"),
    path.join(UPLOADS_BASE_DIR, "OtherFiles"),
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Ensured directory exists: ${dir}`);
    } catch (error) {
      console.error(`Failed to create directory ${dir}: ${error.message}`);
      throw new Error(`Failed to create upload directory ${dir}: ${error.message}`);
    }
  }
};