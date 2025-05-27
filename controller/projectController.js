import Project from '../models/projectModal.js';
import User from '../models/userModel.js';
import * as fileUtils from '../utils/fileUtils.js';
import { isValidObjectId } from '../utils/validators.js';
import { ROLES, } from '../config/constants.js';
import { genSaltSync } from 'bcryptjs';
import { generateId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import path from "path";
import fs from "fs/promises";
import { createReadStream, existsSync } from 'fs';
import { fileURLToPath } from "url";
import archiver from 'archiver';



import { setProjectId, uploadProjectMedia, handleUploadError, cleanupTempFiles } from "../middleware/upload.js"
import { saveThumbnail, saveImage, saveVideo, saveSourceCode, saveOtherFile } from "../utils/fileUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_BASE_DIR = path.join(__dirname, "../Uploads");



// Ensure necessary directories exist
const ensureDirectoryExistence = async (filePath) => {
  const dirname = path.dirname(filePath);
  console.log(`Attempting to ensure directory: ${dirname}`);
  try {
    if (!existsSync(dirname)) {
      console.log(`Directory ${dirname} does not exist, creating...`);
      await fs.mkdir(dirname, { recursive: true });
      console.log(`Created directory: ${dirname}`);
    } else {
      console.log(`Directory ${dirname} already exists`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to create directory ${dirname}: ${err.message}`);
    throw new Error(`Failed to create directory: ${dirname}`);
  }
};

export const createProject = async (req, res) => {
  try {
    

    const { title, description, category, price, tags, techStack, projectType, collegeId, collegeName } = req.body;
    const userId = req.user?.userId;

    // Validate required fields
    if (!userId) {
      return res.status(401).json({ message: "Authentication required: userId is missing" });
    }

    if (!title || !description || !category || !price || !projectType) {
      console.error("Missing required fields:", { title, description, category, price, projectType });
      return res.status(400).json({
        message: "Missing required fields: title, description, category, price, or projectType",
      });
    }

    // Parse JSON fields
    let parsedTags = [];
    let parsedTechStack = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
      parsedTechStack = techStack ? JSON.parse(techStack) : [];
    } catch (error) {
      console.error("Error parsing JSON fields:", error);
      return res.status(400).json({ message: "Invalid format for tags or techStack" });
    }

    // Use projectId from setProjectId middleware
    const projectId = req.body.projectId;
    console.log(`Using projectId: ${projectId}`);

    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      console.error("No files uploaded");
      return res.status(400).json({ message: "No files uploaded. Thumbnail is required." });
    }

    // Check for required thumbnail
    if (!req.files.thumbnail || req.files.thumbnail.length === 0) {
      console.error("Thumbnail missing");
      await cleanupTempFiles(req.files);
      return res.status(400).json({ message: "Thumbnail is required" });
    }

    // Create project directories
    const projectBaseDir = path.join(UPLOADS_BASE_DIR, projectId);
    const projectDirs = ["Thumbnails", "Images", "Videos", "SourceCode", "OtherFiles"];
    for (const dir of projectDirs) {
      await ensureDirectoryExistence(path.join(projectBaseDir, dir));
    }

    // Process files
    let thumbnailPath = null;
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      console.log("Processing thumbnail:", req.files.thumbnail[0].originalname);
      thumbnailPath = await saveThumbnail(req.files.thumbnail[0], projectId);
    }

    let imagePaths = [];
    if (req.files.images && req.files.images.length > 0) {
      console.log(`Processing ${req.files.images.length} images`);
      for (const file of req.files.images) {
        const imagePath = await saveImage(file, projectId);
        imagePaths.push(imagePath);
      }
    }

    let videoPath = null;
    if (req.files.video && req.files.video.length > 0) {
      console.log("Processing video:", req.files.video[0].originalname);
      videoPath = await saveVideo(req.files.video[0], projectId);
    }

    let sourceCodePath = null;
    if (req.files.sourceCode && req.files.sourceCode.length > 0) {
      console.log("Processing source code:", req.files.sourceCode[0].originalname);
      sourceCodePath = await saveSourceCode(req.files.sourceCode[0], projectId);
    }

    let otherFilePaths = [];
    if (req.files.otherFiles && req.files.otherFiles.length > 0) {
      console.log(`Processing ${req.files.otherFiles.length} other files`);
      for (const file of req.files.otherFiles) {
        const filePath = await saveOtherFile(file, projectId);
        otherFilePaths.push(filePath);
      }
    }

    // Create and save the project
    const project = new Project({
      projectId,
      title,
      description,
      category,
      uploadedBy: userId,
      price: parseFloat(price),
      rating: 0,
      buyers: [],
      collegeDetails: {
        collegeId: collegeId || "",
        collegeName: collegeName || "",
      },
      tags: parsedTags,
      techStack: parsedTechStack,
      sourceCode: sourceCodePath,
      thumbnail: thumbnailPath,
      images: imagePaths,
      video: videoPath,
      otherFiles: otherFilePaths,
      projectType,
      status: "Active",
      teamMembers: [{ user: userId, role: ROLES.PROJECT_CREATOR }],
      logs: [{ action: `Project created by user ${userId}`, userId, timestamp: new Date() }],
    });

    await project.save();
    console.log("Project saved successfully:", projectId);

    return res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Error in createProject:", error);
    try {
      const projectDir = path.join(UPLOADS_BASE_DIR, projectId);
      if (existsSync(projectDir)) {
        await fs.rm(projectDir, { recursive: true });
        console.log(`Cleaned up project directory: ${projectDir}`);
      }
      await cleanupTempFiles(req.files);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    return res.status(500).json({
      message: "Failed to upload project",
      error: error.message,
    });
  }
};

export const getProjectsByUsers = async (req, res) => {
  try {
    let query = {};
    
    // Admin can see all projects
    if (req.user.role !== ROLES.ADMIN) {
      // Regular users can only see projects they're part of
      query = { 'teamMembers.user': req.user.userId };
    }

    
    
    const projects = await Project.find(query)
      .populate('teamMembers.user', 'username email')
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};



export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Validate input: ensure projectId is a non-empty string
    if (!projectId || typeof projectId !== 'string') {
      console.error('Invalid project ID:', projectId);
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Build query using $or to check both projectId and _id
    const query = {
      $or: [
        { projectId: projectId }, 
      ],
    };
    if (mongoose.isValidObjectId(projectId)) {
      query.$or.push({ _id: projectId });
    }

    // Query the Project model
    const project = await Project.findOne(query)
      .populate({
        path: 'teamMembers.user',
        select: 'username email profilePicture',
        // Skip population for invalid user IDs
        match: { _id: { $exists: true } },
      })
      .populate('uploadedBy', 'username email')
      

    // Check if project exists
    if (!project) {
      console.error('Project not found for projectId or _id:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

   



    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({
      message: 'Failed to fetch project',
      error: error.message,
    });
  }
};

export const getProjectsByFilters = async (req, res) => {
  try {
    let query = {};
    const { category, sortBy } = req.query;

    if (category) {
      query.category = category;
    }

    // Fetch projects without population
    let projects = await Project.find(query);
    
    // Extract all user IDs that need to be fetched
    const userIds = new Set();
    projects.forEach(project => {
      if (project.uploadedBy) userIds.add(project.uploadedBy);
      if (project.teamMembers && project.teamMembers.length > 0) {
        project.teamMembers.forEach(member => {
          if (member.user) userIds.add(member.user);
        });
      }
    });
    
    // Fetch users with their details, including uploadedFiles
    const users = await User.find({ 
      userId: { $in: Array.from(userIds) }
    }, 'userId firstName middleName lastName uploadedFiles');
    
    // Create a map of user data for quick lookup
    const userMap = {};
    users.forEach(user => {
      // Extract profilePicture URL from uploadedFiles
      const profilePictureUrl = user.uploadedFiles?.find(file => file.name === "profilePicture")?.url || '';
      
      userMap[user.userId] = {
        userId: user.userId,
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        profilePicture: profilePictureUrl // Use URL from uploadedFiles, default to empty string
      };
    });
    
    // Transform projects to include user data
    projects = projects.map(project => {
      const projectObj = project.toObject ? project.toObject() : project;
      
      // Add uploadedBy user details
      if (projectObj.uploadedBy && userMap[projectObj.uploadedBy]) {
        projectObj.uploadedByDetails = userMap[projectObj.uploadedBy];
      }
      
      // Add team members user details
      if (projectObj.teamMembers && Array.isArray(projectObj.teamMembers)) {
        projectObj.teamMembers = projectObj.teamMembers.map(member => {
          if (member.user && userMap[member.user]) {
            return {
              ...member,
              userDetails: userMap[member.user]
            };
          }
          return member;
        });
      }
      
      return projectObj;
    });

    // Apply sorting
    if (sortBy) {
      switch (sortBy.toLowerCase()) {
        case 'latest':
          projects = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'top-rated':
          projects = projects.sort((a, b) => b.rating - a.rating);
          break;
        case 'most-bought':
          projects = projects.sort((a, b) => b.buyers.length - a.buyers.length);
          break;
        case 'top-featured':
          const maxRating = 5;
          const maxBuyers = Math.max(...projects.map(p => p.buyers.length), 1);
          const oldestDate = Math.min(...projects.map(p => new Date(p.createdAt).getTime()));
          const now = Date.now();
          const maxAge = now - oldestDate || 1;

          projects = projects.map(project => {
            const ratingScore = project.rating / maxRating;
            const buyerScore = project.buyers.length / maxBuyers;
            const recencyScore = (now - new Date(project.createdAt).getTime()) / maxAge;
            const score = 0.4 * ratingScore + 0.4 * buyerScore + 0.2 * (1 - recencyScore);
            return { ...project, featureScore: score };
          }).sort((a, b) => b.featureScore - a.featureScore);
          break;
        default:
          projects = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      projects = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json({
      success: true,
      category: category || 'all', 
      sortBy: sortBy || 'latest', 
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { title, description, status } = req.body;

    // Validate input: ensure projectId is a non-empty string
    if (!projectId || typeof projectId !== 'string') {
      console.error('Invalid project ID:', projectId);
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Build query using $or to check both projectId and _id
    const query = {
      $or: [
        { projectId: projectId }, // Custom projectId
      ],
    };
    if (mongoose.isValidObjectId(projectId)) {
      query.$or.push({ _id: projectId });
    }

    // Find the project
    const project = await Project.findOne(query);

    if (!project) {
      console.error('Project not found for projectId or _id:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is admin or project manager
    const isProjectManager = project.teamMembers.some(
      member => member.user.toString() === req.user.userId && member.role === ROLES.PROJECT_CREATOR
    );

    if (req.user.role !== ROLES.ADMIN && !isProjectManager) {
      console.error('Access denied for user:', req.user.userId, 'on project:', projectId);
      return res.status(403).json({ message: 'You do not have permission to update this project' });
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;

    // Handle thumbnail update
    if (req.files && req.files.thumbnail) {
      // Delete old thumbnail if exists
      if (project.thumbnail) {
        await fileUtils.deleteFile(project.thumbnail);
      }
      project.thumbnail = await fileUtils.saveThumbnail(req.files.thumbnail[0]); // Adjust for single file
    }

    project.updatedAt = Date.now();
    await project.save();

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({
      message: 'Failed to update project',
      error: error.message,
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Validate input: ensure projectId is a non-empty string
    if (!projectId || typeof projectId !== 'string') {
      console.error('Invalid project ID:', projectId);
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Build query using $or to check both projectId and _id
    const query = {
      $or: [
        { projectId: projectId }, // Custom projectId
      ],
    };
    if (mongoose.isValidObjectId(projectId)) {
      query.$or.push({ _id: projectId });
    }

    // Find the project
    const project = await Project.findOne(query);

    if (!project) {
      console.error('Project not found for projectId or _id:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin or the project creator can delete projects
    if (req.user.role !== ROLES.ADMIN && project.uploadedBy.toString() !== req.user.userId) {
      console.error('Access denied for user:', req.user.userId, 'on project:', projectId);
      return res.status(403).json({ message: 'You do not have permission to delete this project' });
    }

    // Delete associated files
    if (project.thumbnail) {
      await fileUtils.deleteFile(project.thumbnail);
    }

    // Delete any source code files
    if (project.files && project.files.length > 0) {
      for (const file of project.files) {
        await fileUtils.deleteFile(file);
      }
    }

    // Delete the project
    await Project.deleteOne(query);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({
      message: 'Failed to delete project',
      error: error.message,
    });
  }};

export const addTeamMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    
    if (!isValidObjectId(projectId) || !isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid project or user ID' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions - only admin or project manager can add team members
    const isProjectManager = project.teamMembers.some(
      member => member.user.toString() === req.user.id && member.role === ROLES.PROJECT_MANAGER
    );
    
    if (req.user.role !== ROLES.ADMIN && !isProjectManager) {
      return res.status(403).json({ message: 'You do not have permission to add team members' });
    }
    
    // Check if user is already a team member
    if (project.teamMembers.some(member => member.user.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a team member' });
    }
    
    project.teamMembers.push({
      user: userId,
      role: role || ROLES.DEVELOPER
    });
    
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      project
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Failed to add team member', error: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    if (!isValidObjectId(projectId) || !isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid project or user ID' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permissions - only admin or project manager can remove team members
    const isProjectManager = project.teamMembers.some(
      member => member.user.toString() === req.user.id && member.role === ROLES.PROJECT_MANAGER
    );
    
    if (req.user.role !== ROLES.ADMIN && !isProjectManager) {
      return res.status(403).json({ message: 'You do not have permission to remove team members' });
    }
    
    // Cannot remove the creator if they're a team member
    if (userId === project.uploadedBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }
    
    // Remove the team member
    project.teamMembers = project.teamMembers.filter(
      member => member.user.toString() !== userId
    );
    
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      project
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: 'Failed to remove team member', error: error.message });
  }
};



// Request Collaboration
export const requestCollaboration = async (req, res) => {
  try {
    const { projectId, message } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!projectId || !message) {
      return res.status(400).json({ message: "Project ID and message are required" });
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user already requested collaboration
    if (project.collaborationRequests.some(req => req.userId === userId && req.status === "Pending")) {
      return res.status(400).json({ message: "Collaboration request already pending" });
    }

    project.collaborationRequests.push({ userId, message, status: "Pending", requestedAt: new Date() });
    project.logs.push({ action: `Collaboration requested by user ${userId}`, userId, timestamp: new Date() });

    await project.save();
    return res.status(201).json({ success: true, message: "Collaboration request submitted" });
  } catch (error) {
    console.error("Error in requestCollaboration:", error);
    return res.status(500).json({ message: "Failed to request collaboration", error: error.message });
  }
};


export const downloadAllProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log(req.params);
    
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'You must be logged in to download files' });
    }
    const query = {
      $or: [{ projectId }, mongoose.isValidObjectId(projectId) ? { _id: projectId } : {}],
    };
    const project = await Project.findOne(query);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create safe filename from project title
    const safeTitle = project.title
      ? project.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      : 'project';
    console.log('====================================');
    console.log('project',project.title);
    console.log('====================================');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    if (project.sourceCode) {
      const sourcePath = path.join(process.cwd(), project.sourceCode);
      if (existsSync(sourcePath)) {
        archive.file(sourcePath, { name: `source_code_${project.title}.zip` });
      }
    }
    if (project.otherFiles && project.otherFiles.length > 0) {
      project.otherFiles.forEach((filePath, index) => {
        const fullPath = path.join(process.cwd(), filePath);
        if (existsSync(fullPath)) {
          archive.file(fullPath, { name: path.basename(filePath) });
        }
      });
    }
    await archive.finalize();
  } catch (error) {
    console.error('Error downloading all files:', error);
    res.status(500).json({ message: 'Failed to download files', error: error.message });
  }
};

export const downloadProjectFile = async (req, res) => {
  try {
    const { projectId, fileType, fileIndex } = req.params;

    console.log(req.params);
    
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    if (!['sourceCode', 'otherFiles'].includes(fileType)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
    if (fileType === 'otherFiles' && (isNaN(fileIndex) || fileIndex < 0)) {
      return res.status(400).json({ message: 'Invalid file index' });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'You must be logged in to download files' });
    }
    const query = {
      $or: [{ projectId }, mongoose.isValidObjectId(projectId) ? { _id: projectId } : {}],
    };
    const project = await Project.findOne(query);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    let filePath;
    let fileName;
    if (fileType === 'sourceCode') {
      filePath = path.join(process.cwd(), project.sourceCode);
      fileName = `source_code_${project.projectId}.zip`;
    } else {
      const otherFilePath = project.otherFiles[parseInt(fileIndex)];
      if (!otherFilePath) {
        return res.status(404).json({ message: 'File not found' });
      }
      filePath = path.join(process.cwd(), otherFilePath);
      fileName = path.basename(otherFilePath);
    }
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
};