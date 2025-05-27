
import mongoose from "mongoose";
/**
 * Validates user registration data
 * @param {Object} userData - User registration data
 * @returns {Object} - {isValid, errors}
 */
export const validateUserRegistration = (userData) => {
  const errors = {};

  // Required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'password'];
  requiredFields.forEach(field => {
    if (!userData[field]) {
      errors[field] = `${field} is required`;
    }
  });

  // Email validation
  if (userData.email && !/^\S+@\S+\.\S+$/.test(userData.email)) {
    errors.email = 'Invalid email format';
  }

  // Password complexity
  if (userData.password && userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  // Phone number validation if provided
  if (userData.phone && !/^\d{10}$/.test(userData.phone)) {
    errors.phone = 'Phone number must be 10 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates project upload data
 * @param {Object} projectData - Project data
 * @returns {Object} - {isValid, errors}
 */
export const validateProjectUpload = (projectData) => {
  const errors = {};

  // Required fields
  const requiredFields = ['title', 'description', 'category', 'uploadedBy', 'price', 'projectType'];
  requiredFields.forEach(field => {
    if (!projectData[field]) {
      errors[field] = `${field} is required`;
    }
  });

  // Price validation
  if (projectData.price && (isNaN(projectData.price) || parseFloat(projectData.price) < 0)) {
    errors.price = 'Price must be a non-negative number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};


export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}




export const isValidObjectId = (id) => {
  
  if (mongoose.Types.ObjectId.isValid(id)) return true;

  const customIdRegex = /^(PRJ|USR)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return customIdRegex.test(id);
};

