import express from 'express';
const router = express.Router();
import * as authController from '../controller/authController.js';
import { auth } from '../middleware/auth.js';


// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password",authController.resetPassword);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
// router.put('/change-password', auth, authController.changePassword);
// router.put('/update-profile', auth, authController.updateProfile);

export default router;
