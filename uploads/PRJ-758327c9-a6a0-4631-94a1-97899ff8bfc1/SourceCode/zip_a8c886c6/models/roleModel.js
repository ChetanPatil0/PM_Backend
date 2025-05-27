
import mongoose from "mongoose";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../config/constants.js";

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: Object.values(ROLES)
  },
  permissions: [{
    type: String,
    enum: Object.values(PERMISSIONS)
  }],
  description: { type: String },
  isCustom: { type: Boolean, default: false },
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

// Initialize default roles with their permissions
roleSchema.statics.initializeRoles = async function() {
  const roles = Object.keys(ROLES);
  
  for (const role of roles) {
    const roleName = ROLES[role];
    const permissions = ROLE_PERMISSIONS[roleName];
    
    const exists = await this.findOne({ name: roleName });
    
    if (!exists) {
      await this.create({
        name: roleName,
        permissions,
        description: `Default ${roleName} role`,
        isCustom: false
      });
      console.log(`Created default role: ${roleName}`);
    }
  }
};

const Role = mongoose.model("Role", roleSchema);

export default Role;