import express from 'express';
const router = express.Router();
import * as projectController from '../controller/projectController.js';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

import { ROLES } from '../config/constants.js';
import {uploadProjectMedia,handleUploadError} from '../middleware/upload.js';
import upload from "../middleware/multerConfig.js";



// Create project - any authenticated user can create
router.post('/project-upload',auth, uploadProjectMedia,handleUploadError, projectController.createProject);

// Get all projects - filtered by permissions
router.get('/projectsByUsers', auth, projectController.getProjectsByUsers);
router.get('/get-projects', projectController.getProjectsByFilters);


// Get project by ID - with permission check
router.get('/:projectId', auth, projectController.getProjectById);

// Update project - project managers and admins only
router.put('/:projectId', 
  auth,
  uploadProjectMedia,handleUploadError,
  projectController.updateProject
);

// Delete project - creator and admins only
router.delete('/:projectId', auth, projectController.deleteProject);

// Team member management
router.post('/:projectId/team', auth, projectController.addTeamMember);
router.delete('/:projectId/team/:userId', auth, projectController.removeTeamMember);

export default router;
























// Get all featured projects: GET /api/projects?sortBy=top-featured
// Get featured projects in a specific category: GET /api/projects?category=WebDevelopment&sortBy=top-featured
// Get latest projects: GET /api/projects?sortBy=latest
// Get top-rated projects: GET /api/projects?sortBy=top-rated
// Get most-bought projects: GET /api/projects?sortBy=most-bought