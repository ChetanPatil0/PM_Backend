import express from 'express';
const router = express.Router();
import * as userController from '../controller/userController.js';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';



// Admin only routes
router.get('/all', auth, checkRole([ROLES.ADMIN]), userController.getAllUsers);
router.put('/:userId/role', auth, checkRole([ROLES.ADMIN]), userController.updateUserRole);
router.delete('/:userId', auth, checkRole([ROLES.ADMIN]), userController.deleteUser);

// User routes with auth
// router.post('/upload/:userId', auth, uploadUserMedia, handleUploadError, userController.uploadUserFiles);
// router.put('/profile-picture', auth, uploadProfilePicture, handleUploadError, userController.updateProfilePicture);

export default router;
