
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  userType: { type: String }, // student, freelancer, creator, professional, organization
  userCountry: { type: String},
  state: { type: String },
  city: { type: String },
  pincode: { type: String },
  collegeDetails: [
    {
      collegeId: { type: String },
      collegeName: { type: String },
    },
  ],
  role: { 
    type: String, 
    required: true, 
    default: ROLES.USER,
    enum: Object.values(ROLES)
  },
  permissions: [{ type: String }],
  uploadedProjects: [{ type: String }],
  boughtProjects: [{ type: String }],
  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;