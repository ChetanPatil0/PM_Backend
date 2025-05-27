// import express from 'express';
// const router = express.Router();
// import * as userController from '../controller/userController.js';
// import { auth } from '../middleware/auth.js';
// import { checkRole } from '../middleware/roleCheck.js';
// import { ROLES } from '../config/constants.js';



// // Admin only routes
// router.get('/all', auth, checkRole([ROLES.ADMIN]), userController.getAllUsers);
// router.put('/:userId/role', auth, checkRole([ROLES.ADMIN]), userController.updateUserRole);
// router.delete('/:userId', auth, checkRole([ROLES.ADMIN]), userController.deleteUser);

// // User routes with auth
// // router.post('/upload/:userId', auth, uploadUserMedia, handleUploadError, userController.uploadUserFiles);
// // router.put('/profile-picture', auth, uploadProfilePicture, handleUploadError, userController.updateProfilePicture);

// export default router;


import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateProfile, 
  deleteOwnAccount, 
  updateUserRole, 
  deleteUser, 
  updateProfilePicture, 
  searchUsers, 
  getUserStats,
  uploadUserFiles,
  getProfilePictureById
} from '../controller/userController.js';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';
import { uploadUserMedia, uploadProfilePicture, handleUploadError } from '../middleware/upload.js'

const router = express.Router();

// Admin only routes
router.get('/all', auth, checkRole([ROLES.ADMIN]), getAllUsers);
router.put('/:userId/role', auth, checkRole([ROLES.ADMIN]), updateUserRole);
router.delete('/:userId', auth, checkRole([ROLES.ADMIN]), deleteUser);

// User routes with auth
router.get('/:userId', auth, getUserById);
router.put('/:userId', auth, updateProfile);

router.delete('/delete-me', auth, deleteOwnAccount);
router.post('/upload/:userId', auth, uploadUserMedia, handleUploadError, uploadUserFiles);
router.get('/search', auth, searchUsers);
router.get('/stats', auth, checkRole([ROLES.ADMIN]), getUserStats);

router.put('/profile-picture', auth, uploadProfilePicture, handleUploadError, updateProfilePicture);
router.get('/profile-picture/:userId', auth, getProfilePictureById);

export default router;