// import express from 'express';
// const router = express.Router();
// import * as authController from '../controller/authController.js';
// import { auth } from '../middleware/auth.js';


// // Public routes
// router.post('/register', authController.register);
// router.post('/login', authController.login);
// router.post("/request-password-reset", authController.requestPasswordReset);
// router.post("/reset-password",authController.resetPassword);

// // Protected routes
// router.get('/me', auth, authController.getCurrentUser);
// // router.put('/change-password', auth, authController.changePassword);
// // router.put('/update-profile', auth, authController.updateProfile);

// export default router;



import express from 'express';
import { 
  register, 
  login, 
  getCurrentUser, 
  requestPasswordReset, 
  resetPassword,
  githubLogin,
  githubCallback,
  linkedinLogin,
  linkedinCallback,
  changePassword,
} from '../controller/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/linkedin', linkedinLogin);
router.get('/linkedin/callback', linkedinCallback);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/change-password', auth, changePassword);



export default router;