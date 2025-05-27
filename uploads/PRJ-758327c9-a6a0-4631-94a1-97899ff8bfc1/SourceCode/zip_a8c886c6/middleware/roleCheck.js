import { ROLES, ROLE_PERMISSIONS } from "../config/constants.js";

/**
 * Middleware to check if user has required permissions
 * @param {Array} requiredPermissions - Array of permissions required
 */
export const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // User must be authenticated first
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get user permissions
      const userPermissions = req.user.permissions || ROLE_PERMISSIONS[req.user.role] || [];
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          message: "Insufficient permissions",
          required: requiredPermissions,
          userPermissions
        });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
};

/**
 * Middleware to restrict access by role
 * @param {Array} allowedRoles - Array of allowed roles
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // User must be authenticated first
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: "Access denied",
          required: allowedRoles,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
};

/**
 * Middleware for Admin only actions
 */
export const adminOnly = checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SYSTEM_ADMIN]);

/**
 * Middleware for Super Admin only actions
 */
export const superAdminOnly = checkRole([ROLES.SUPER_ADMIN]);