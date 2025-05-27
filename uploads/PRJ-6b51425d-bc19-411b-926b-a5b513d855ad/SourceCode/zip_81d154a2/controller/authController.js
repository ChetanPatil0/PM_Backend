
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { ROLE_PERMISSIONS ,TOKEN_EXPIRY,JWT_SECRET} from "../config/constants.js";
import { generateId } from "../utils/idGenerator.js";
import { validateUserRegistration } from "../utils/validators.js";
import { generateToken } from "../middleware/auth.js";
import { generateVerificationCode } from "../utils/generateVerificationCod.js";


const findUserByIdentifier = async (identifier) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return await User.findOne({
    $or: [
      { mobile: normalizedIdentifier },
      { email: normalizedIdentifier },
      { userId: normalizedIdentifier }
    ]
  });
};


/**
 * User registration
 */
export const register = async (req, res) => {
  try {
    const userData = req.body;
 
   

    // Validate user input
    const { isValid, errors } = validateUserRegistration(userData);
    if (!isValid) {
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Generate user ID
    const userId = await generateId("user");
    
    // Get permissions based on role
    const permissions = ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.user;
    
    // Create new user
    const newUser = new User({
      userId,
      ...userData,
      permissions
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Return user data without password
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
 * Get current user profile
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is already added to req by auth middleware
    const { password, ...userWithoutPassword } = req.user.toObject();
    
    res.json(userWithoutPassword);
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

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();

    // Store code and expiry (10 minutes)
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email with verification code
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

    // Basic password validation
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

    // Update password
    user.password = newPassword; // Assumes password hashing in User model
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate JWT token for login (using default TOKEN_EXPIRY)
    const token = generateToken(user.userId, user.email, user.role); 

    // Return user data without password
    const { password, ...userWithoutPassword } = user.toObject();

    res.json({
      message: "Password reset successfully",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};