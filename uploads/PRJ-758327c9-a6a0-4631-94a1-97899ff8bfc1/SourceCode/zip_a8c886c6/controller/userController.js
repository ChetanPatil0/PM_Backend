import User from '../models/userModel.js';
import { generateToken } from '../middleware/auth.js';
import * as fileUtils from '../utils/fileUtils.js';
import { isValidObjectId, isValidEmail } from '../utils/validators.js';
import { ROLES } from '../config/constants.js';
import bcrypt from 'bcryptjs';

// Get all users - admin only
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If not admin and not requesting own profile, return limited info
    if (req.user.role !== ROLES.ADMIN && req.user.id !== userId) {
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role
        }
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// Update user profile - users can update their own profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, bio, phoneNumber } = req.body;
    const userId = req.user.id; // Get ID from authenticated user
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate email if being updated
    if (email && email !== user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if email is already in use
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      
      user.email = email;
    }
    
    // Update other fields if provided
    if (username) {
      // Check if username is already taken
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      user.username = username;
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    
    user.updatedAt = Date.now();
    await user.save();
    
    // Return updated user without sensitive info
    const updatedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Delete own account - users can delete their own account
export const deleteOwnAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password before allowing deletion
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    
    // Delete profile picture if exists
    if (user.profilePicture) {
      await fileUtils.deleteFile(user.profilePicture);
    }
    
    // You might want to handle project ownership transfer or deletion here
    // This would depend on your business requirements
    
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      success: true,
      message: 'Your account has been successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};

// Update user role - admin only
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate role
    const validRoles = Object.values(ROLES);
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role', 
        validRoles 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Cannot modify own role
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ message: 'Cannot modify your own role' });
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

// Delete user - admin only
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Cannot delete own account using this endpoint
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account using this endpoint' });
    }
    
    // Delete profile picture if exists
    if (user.profilePicture) {
      await fileUtils.deleteFile(user.profilePicture);
    }
    
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Update profile picture
export const updateProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No profile picture uploaded' });
    }
    
    // Delete old profile picture if exists
    if (user.profilePicture) {
      await fileUtils.deleteFile(user.profilePicture);
    }
    
    // Save new profile picture
    const profilePicturePath = await fileUtils.saveProfilePicture(req.file);
    
    user.profilePicture = profilePicturePath;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Failed to update profile picture', error: error.message });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id username email profilePicture role').limit(10);
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users', error: error.message });
  }
};

// Get user stats - admin only
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Count users by role
    const roleCount = {};
    for (const role of Object.values(ROLES)) {
      roleCount[role] = await User.countDocuments({ role });
    }
    
    // Get users registered in the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        roleDistribution: roleCount,
        newUsersLastMonth: newUsers
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user stats', error: error.message });
  }
};