
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { ROLE_PERMISSIONS, TOKEN_EXPIRY, JWT_SECRET } from "../config/constants.js";
import { generateId } from "../utils/idGenerator.js";
import { validateUserRegistration } from "../utils/validators.js";
import { generateToken } from "../middleware/auth.js";
import { generateVerificationCode } from "../utils/generateVerificationCod.js";
import passport from 'passport';
import { BASE_URL_CALLBACK } from "../constant/constant.jsx";

const findUserByIdentifier = async (identifier, options = {}) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  return await User.findOne({
    $or: [
      { mobile: normalizedIdentifier },
      { email: normalizedIdentifier },
      { userId: normalizedIdentifier },
      { githubId: normalizedIdentifier },
      { linkedinId: normalizedIdentifier }
    ]
  }, null, options);
};

/**
 * User registration
 */
export const register = async (req, res) => {
  try {
    const userData = req.body;

    const { isValid, errors } = validateUserRegistration(userData);
    if (!isValid) {
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const userId = await generateId("user");
    const permissions = ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.user;
    
    const newUser = new User({
      userId,
      ...userData,
      permissions
    });
    
    await newUser.save();
    
    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    const { password, ...userWithoutPassword } = newUser.toObject();
    
    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * User login
 */
export const login = async (req, res) => {
  try {
    const { 
      identifier, 
      password, 
      email,
      mobile
    } = req.body;

    const loginIdentifier = identifier || email || mobile;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        message: "Login identifier (mobile/email/userId) and password are required",
        receivedBody: req.body
      });
    }

    const user = await findUserByIdentifier(loginIdentifier);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(
      user._id,
      loginIdentifier,
      user.role
    );

    const { password: pwd, ...userWithoutPassword } = user.toObject();

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message 
    });
  }
};

/**
 * GitHub OAuth login
 */
export const githubLogin = passport.authenticate('github', { scope: ['user:email'] });

/**
 * GitHub OAuth callback
 */
export const githubCallback = async (req, res) => {
  passport.authenticate('github', { failureRedirect: '/login' }, async (err, user) => {
    try {
      if (err || !user) {
        console.error('GitHub authentication failed:', err || 'No user');
        return res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent('GitHub authentication failed')}`);
      }

      console.log('GitHub callback user:', JSON.stringify(user, null, 2));

      // Start MongoDB transaction
      let session;
      try {
        session = await User.startSession();
        session.startTransaction();
      } catch (sessionError) {
        console.warn('MongoDB transactions not supported, proceeding without:', sessionError.message);
        session = null;
      }

      // Ensure user is fully populated
      let dbUser = await User.findById(user._id, null, session ? { session } : {});
      if (!dbUser) {
        console.error('User not found in database:', user._id);
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent('User not found')}`);
      }

      // Update lastLogin
      dbUser.lastLogin = new Date();
      await dbUser.save(session ? { session } : {});

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      const token = generateToken(dbUser._id, dbUser.email || dbUser.githubId, dbUser.role);
      console.log(`Login successful for user: _id=${dbUser._id}, email=${dbUser.email}, githubId=${dbUser.githubId}`);
      return res.redirect(
        `${BASE_URL_CALLBACK}/?token=${encodeURIComponent(token)}&success=${encodeURIComponent('GitHub login successful')}`
      );
    } catch (error) {
      console.error('GitHub callback error:', error.message, error.stack);
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent(error.message)}`);
    }
  })(req, res);
};

/**
 * LinkedIn OAuth login
 */
export const linkedinLogin = passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress'] });

/**
 * LinkedIn OAuth callback
 */
export const linkedinCallback = async (req, res) => {
  passport.authenticate('linkedin', { failureRedirect: '/login' }, async (err, user) => {
    try {
      if (err || !user) {
        console.error('LinkedIn authentication failed:', err || 'No user');
        return res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent('LinkedIn authentication failed')}`);
      }

      // Start MongoDB transaction
      let session;
      try {
        session = await User.startSession();
        session.startTransaction();
      } catch (sessionError) {
        console.warn('MongoDB transactions not supported, proceeding without:', sessionError.message);
        session = null;
      }

      let dbUser = await User.findById(user._id, null, session ? { session } : {});
      if (!dbUser) {
        console.error('User not found in database:', user._id);
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent('User not found')}`);
      }

      dbUser.lastLogin = new Date();
      await dbUser.save(session ? { session } : {});

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      const token = generateToken(dbUser._id, dbUser.email || dbUser.linkedinId, dbUser.role);
      console.log(`Login successful for user: _id=${dbUser._id}, email=${dbUser.email}, linkedinId=${dbUser.linkedinId}`);
      return res.redirect(
        `${BASE_URL_CALLBACK}/?token=${encodeURIComponent(token)}&success=${encodeURIComponent('LinkedIn login successful')}`
      );
    } catch (error) {
      console.error('LinkedIn callback error:', error.message, error.stack);
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      res.redirect(`${BASE_URL_CALLBACK}/login?error=${encodeURIComponent(error.message)}`);
    }
  })(req, res);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req, res) => {
  try {
    const { password, githubAccessToken, linkedinAccessToken, ...userWithoutSensitive } = req.user.toObject();
    res.json(userWithoutSensitive);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * Request password reset with verification code sent via email
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationCode = generateVerificationCode();
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailContent = {
      to: user.email,
      subject: "Password Reset Verification Code",
      text: `Your password reset code is: ${verificationCode}\nThis code will expire in 10 minutes.`,
      html: `<p>Your password reset code is: <strong>${verificationCode}</strong></p><p>This code will expire in 10 minutes.</p>`
    };

    await sendEmail(emailContent);

    res.json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * Reset password using verification code
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ message: "Email, verification code, and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordCode: verificationCode,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user.userId, user.email, user.role);
    const { password, githubAccessToken, linkedinAccessToken, ...userWithoutSensitive } = user.toObject();

    res.json({
      message: "Password reset successfully",
      user: userWithoutSensitive,
      token
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one uppercase letter and one number' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};