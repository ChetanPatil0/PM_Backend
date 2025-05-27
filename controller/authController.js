// import jwt from "jsonwebtoken";
// import User from "../models/userModel.js";
// import { ROLE_PERMISSIONS, TOKEN_EXPIRY, JWT_SECRET } from "../config/constants.js";
// import { generateId } from "../utils/idGenerator.js";
// import { validateUserRegistration } from "../utils/validators.js";
// import { generateToken } from "../middleware/auth.js";
// import { generateVerificationCode } from "../utils/generateVerificationCod.js";
// import passport from 'passport';

// const findUserByIdentifier = async (identifier) => {
//   const normalizedIdentifier = identifier.trim().toLowerCase();

//   return await User.findOne({
//     $or: [
//       { mobile: normalizedIdentifier },
//       { email: normalizedIdentifier },
//       { userId: normalizedIdentifier },
//       { githubId: normalizedIdentifier },
//       { linkedinId: normalizedIdentifier }
//     ]
//   });
// };

// /**
//  * User registration
//  */
// export const register = async (req, res) => {
//   try {
//     const userData = req.body;

//     // Validate user input
//     const { isValid, errors } = validateUserRegistration(userData);
//     if (!isValid) {
//       return res.status(400).json({ message: "Validation error", errors });
//     }
    
//     // Check if user exists
//     const existingUser = await User.findOne({ email: userData.email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }
    
//     // Generate user ID
//     const userId = await generateId("user");
    
//     // Get permissions based on role
//     const permissions = ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.user;
    
//     // Create new user
//     const newUser = new User({
//       userId,
//       ...userData,
//       permissions
//     });
    
//     await newUser.save();
    
//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: newUser.userId, email: newUser.email, role: newUser.role },
//       JWT_SECRET,
//       { expiresIn: TOKEN_EXPIRY }
//     );
    
//     // Return user data without password
//     const { password, ...userWithoutPassword } = newUser.toObject();
    
//     res.status(201).json({
//       message: "User registered successfully",
//       user: userWithoutPassword,
//       token
//     });
//   } catch (error) {
//     console.error("Register error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// /**
//  * User login
//  */
// export const login = async (req, res) => {
//   try {
//     const { 
//       identifier, 
//       password, 
//       email,
//       mobile
//     } = req.body;

//     const loginIdentifier = identifier || email || mobile;

//     if (!loginIdentifier || !password) {
//       return res.status(400).json({ 
//         message: "Login identifier (mobile/email/userId) and password are required",
//         receivedBody: req.body
//       });
//     }

//     const user = await findUserByIdentifier(loginIdentifier);

//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     user.lastLogin = new Date();
//     await user.save();

//     const token = generateToken(
//       user._id,
//       loginIdentifier,
//       user.role
//     );

//     const { password: pwd, ...userWithoutPassword } = user.toObject();

//     res.json({
//       message: "Login successful",
//       user: userWithoutPassword,
//       token
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ 
//       message: "Server Error", 
//       error: error.message 
//     });
//   }
// };

// /**
//  * GitHub OAuth login
//  */
// export const githubLogin = passport.authenticate('github', { scope: ['user:email'] });

// /**
//  * GitHub OAuth callback
//  */
// export const githubCallback = async (req, res) => {
//   passport.authenticate('github', { failureRedirect: '/login' }, async (err, profile) => {
//     const session = await User.startSession();
//     session.startTransaction();
//     try {
//       if (err || !profile) {
//         console.error('GitHub authentication failed:', err || 'No profile');
//         await session.abortTransaction();
//         session.endSession();
//         return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('GitHub authentication failed')}`);
//       }

//       console.log('GitHub profile:', JSON.stringify(profile, null, 2));

//       const githubId = profile.id.toString();
//       const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
//       const name = profile.displayName || profile.username || '';
//       const [firstName, ...lastNameArr] = name.split(' ');
//       const lastName = lastNameArr.join(' ') || '';

//       console.log(`Processing GitHub login - githubId: ${githubId}, email: ${email}`);

//       // Check for existing user by githubId or email using findUserByIdentifier
//       let user = await findUserByIdentifier(githubId, { session });
//       if (!user && email) {
//         user = await findUserByIdentifier(email, { session });
//       }

//       if (user) {
//         console.log(`Existing user found: ${user._id}, email: ${user.email}, githubId: ${user.githubId}`);
//         // User exists, link GitHub ID if not already linked
//         if (!user.githubId) {
//           user.githubId = githubId;
//         }
//         user.lastLogin = new Date();
//         await user.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         const token = generateToken(user._id, user.email || user.githubId, user.role);
//         console.log(`Login successful for user: ${user._id}`);
//         return res.redirect(
//           `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('GitHub login successful')}`
//         );
//       }

//       // No user found, create a new one
//       console.log('No existing user found, creating new user');
//       const userId = await generateId("user");
//       const permissions = ROLE_PERMISSIONS.user;

//       user = new User({
//         userId,
//         githubId,
//         email: email || `${githubId}@github.user`,
//         firstName: firstName || 'GitHub',
//         lastName: lastName || 'User',
//         phone: '',
//         role: 'user',
//         permissions,
//         lastLogin: new Date(),
//       });

//       // Double-check for existing user to prevent race conditions
//       const existingUser = await findUserByIdentifier(user.email || githubId, { session });
//       if (existingUser) {
//         console.log(`Race condition detected, using existing user: ${existingUser._id}`);
//         existingUser.githubId = githubId;
//         existingUser.lastLogin = new Date();
//         await existingUser.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         const token = generateToken(existingUser._id, existingUser.email || existingUser.githubId, existingUser.role);
//         console.log(`Login successful for existing user: ${existingUser._id}`);
//         return res.redirect(
//           `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('GitHub login successful')}`
//         );
//       }

//       console.log(`Saving new user with email: ${user.email}, githubId: ${githubId}`);
//       await user.save({ session });

//       await session.commitTransaction();
//       session.endSession();

//       // Auto-login after registration
//       const token = generateToken(user._id, user.email || user.githubId, user.role);
//       console.log(`New user created and logged in: ${user._id}`);
//       return res.redirect(
//         `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('Registration and GitHub login successful')}`
//       );
//     } catch (error) {
//       console.error('GitHub callback error:', error.message, error.stack);
//       await session.abortTransaction();
//       session.endSession();
//       res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
//     }
//   })(req, res);
// };

// /**
//  * LinkedIn OAuth login
//  */
// export const linkedinLogin = passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress'] });

// /**
//  * LinkedIn OAuth callback
//  */
// export const linkedinCallback = async (req, res) => {
//   passport.authenticate('linkedin', { failureRedirect: '/login' }, async (err, profile) => {
//     try {
//       if (err || !profile) {
//         console.error('LinkedIn authentication failed:', err || 'No profile');
//         return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('LinkedIn authentication failed')}`);
//       }

//       const linkedinId = profile.id.toString();
//       const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
//       const firstName = profile.name?.givenName || 'LinkedIn';
//       const lastName = profile.name?.familyName || 'User';

//       // Check if user already exists by linkedinId
//       let user = await User.findOne({ linkedinId });

//       if (!user) {
//         // Check if email exists to prevent duplicate accounts
//         if (email) {
//           user = await User.findOne({ email });
//           if (user) {
//             // Link LinkedIn ID to existing user
//             user.linkedinId = linkedinId;
//             user.lastLogin = new Date();
//             await user.save();

//             const token = generateToken(user._id, user.email || user.linkedinId, user.role);
//             return res.redirect(
//               `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('LinkedIn login successful')}`
//             );
//           }
//         }

//         // Register new user
//         const userId = await generateId("user");
//         const permissions = ROLE_PERMISSIONS.user;

//         user = new User({
//           userId,
//           linkedinId,
//           email: email || `${linkedinId}@linkedin.user`,
//           firstName,
//           lastName,
//           phone: '',
//           role: 'user',
//           permissions,
//           lastLogin: new Date(),
//         });
//         await user.save();

//         // Auto-login after registration
//         const token = generateToken(user._id, user.email || user.linkedinId, user.role);
//         return res.redirect(
//           `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('Registration and LinkedIn login successful')}`
//         );
//       } else {
//         // User exists, check if this is a login attempt
//         user.lastLogin = new Date();
//         await user.save();

//         const token = generateToken(user._id, user.email || user.linkedinId, user.role);
//         return res.redirect(
//           `http://localhost:5173/login?token=${encodeURIComponent(token)}&success=${encodeURIComponent('LinkedIn login successful')}`
//         );
//       }
//     } catch (error) {
//       console.error('LinkedIn callback error:', error.message, error.stack);
//       res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
//     }
//   })(req, res);
// };

// /**
//  * Get current user profile
//  */
// export const getCurrentUser = async (req, res) => {
//   try {
//     // User is already added to req by auth middleware
//     const { password, githubAccessToken, linkedinAccessToken, ...userWithoutSensitive } = req.user.toObject();
    
//     res.json(userWithoutSensitive);
//   } catch (error) {
//     console.error("Get current user error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// /**
//  * Request password reset with verification code sent via email
//  */
// export const requestPasswordReset = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({ email: normalizedEmail });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Generate 6-digit verification code
//     const verificationCode = generateVerificationCode();

//     // Store code and expiry (10 minutes)
//     user.resetPasswordCode = verificationCode;
//     user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
//     await user.save();

//     // Send email with verification code
//     const emailContent = {
//       to: user.email,
//       subject: "Password Reset Verification Code",
//       text: `Your password reset code is: ${verificationCode}\nThis code will expire in 10 minutes.`,
//       html: `<p>Your password reset code is: <strong>${verificationCode}</strong></p><p>This code will expire in 10 minutes.</p>`
//     };

//     await sendEmail(emailContent);

//     res.json({ message: "Verification code sent to email" });
//   } catch (error) {
//     console.error("Request password reset error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// /**
//  * Reset password using verification code
//  */
// export const resetPassword = async (req, res) => {
//   try {
//     const { email, verificationCode, newPassword } = req.body;

//     if (!email || !verificationCode || !newPassword) {
//       return res.status(400).json({ message: "Email, verification code, and new password are required" });
//     }

//     // Basic password validation
//     if (newPassword.length < 8) {
//       return res.status(400).json({ message: "Password must be at least 8 characters long" });
//     }
//     if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
//       return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({
//       email: normalizedEmail,
//       resetPasswordCode: verificationCode,
//       resetPasswordExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired verification code" });
//     }

//     // Update password
//     user.password = newPassword; // Assumes password hashing in User model
//     user.resetPasswordCode = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     // Generate JWT token for login
//     const token = generateToken(user.userId, user.email, user.role);

//     // Return user data without sensitive info
//     const { password, githubAccessToken, linkedinAccessToken, ...userWithoutSensitive } = user.toObject();

//     res.json({
//       message: "Password reset successfully",
//       user: userWithoutSensitive,
//       token
//     });
//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// /**
//  * Change password
//  */
// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const userId = req.user.id; // From auth middleware

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: 'Current and new passwords are required' });
//     }

//     // Basic password validation
//     if (newPassword.length < 8) {
//       return res.status(400).json({ message: 'New password must be at least 8 characters long' });
//     }
//     if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
//       return res.status(400).json({ message: 'New password must contain at least one uppercase letter and one number' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Verify current password
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Current password is incorrect' });
//     }

//     // Update password
//     user.password = newPassword; // Password hashing handled by userSchema.pre('save')
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { ROLE_PERMISSIONS, TOKEN_EXPIRY, JWT_SECRET } from "../config/constants.js";
import { generateId } from "../utils/idGenerator.js";
import { validateUserRegistration } from "../utils/validators.js";
import { generateToken } from "../middleware/auth.js";
import { generateVerificationCode } from "../utils/generateVerificationCod.js";
import passport from 'passport';

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
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('GitHub authentication failed')}`);
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
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('User not found')}`);
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
        `http://localhost:5173/?token=${encodeURIComponent(token)}&success=${encodeURIComponent('GitHub login successful')}`
      );
    } catch (error) {
      console.error('GitHub callback error:', error.message, error.stack);
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
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
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('LinkedIn authentication failed')}`);
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
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('User not found')}`);
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
        `http://localhost:5173/?token=${encodeURIComponent(token)}&success=${encodeURIComponent('LinkedIn login successful')}`
      );
    } catch (error) {
      console.error('LinkedIn callback error:', error.message, error.stack);
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
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