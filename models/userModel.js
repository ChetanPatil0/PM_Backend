


// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import { ROLES } from "../config/constants.js";

// const userSchema = new mongoose.Schema({
//   userId: { type: String, required: true, unique: true },
//   firstName: { type: String, required: true },
//   middleName: { type: String, default: '' },
//   lastName: { type: String, required: true },
//   email: { type: String, unique: true, sparse: true },
//   password: { type: String },
//   phone: { type: String, default: '' },
//   userType: { type: String, default: '' },
//   userCountry: { type: String, default: '' },
//   state: { type: String, default: '' },
//   city: { type: String, default: '' },
//   pincode: { type: String, default: '' },
//   collegeDetails: [
//     {
//       collegeId: { type: String, default: '' },
//       collegeName: { type: String, default: '' },
//     },
//   ],
//   role: { 
//     type: String, 
//     required: true, 
//     default: ROLES.USER,
//     enum: Object.values(ROLES)
//   },
//   permissions: [{ type: String }],
//   uploadedProjects: [{ type: String }],
//   boughtProjects: [{ type: String }],
//   lastLogin: { type: Date },
//   githubId: { type: String, unique: true, sparse: true },
//   linkedinId: { type: String, unique: true, sparse: true },
//   githubAccessToken: { type: String },
//   linkedinAccessToken: { type: String },
//   uploadedFiles: [{ 
//     name: { type: String, required: true },
//     url: { type: String, required: true }
//   }], 
// }, { timestamps: true });

// // Hash password before saving (only for non-OAuth users)
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password') || !this.password) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Compare password method (for non-OAuth users)
// userSchema.methods.comparePassword = async function(password) {
//   if (!this.password) return false;
//   return await bcrypt.compare(password, this.password);
// };


// const User = mongoose.model("User", userSchema);

// export default User;


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  firstName: { type: String },
  middleName: { type: String, default: '' },
  lastName: { type: String },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, default: '' },
  userType: { type: String, default: '' },
  userCountry: { type: String, default: '' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  collegeDetails: [
    {
      collegeId: { type: String, default: '' },
      collegeName: { type: String, default: '' },
      isPrimary: { type: Boolean, default: true },
      isSecondary: { type: Boolean, default: false },
      collegeLink: { type: String, default: '' }
    }
  ],
  professionalDetails: {
    teachingCollege: { 
      collegeId: { type: String, default: '' },
      collegeName: { type: String, default: '' },
      collegeLink: { type: String, default: '' }
    },
    companyName: { type: String, default: '' },
    companyLink: { type: String, default: '' }
  },
  role: { 
    type: String, 
    default: ROLES.USER,
    enum: Object.values(ROLES)
  },
  permissions: [{ type: String }],
  uploadedProjects: [{ type: String }],
  boughtProjects: [{ type: String }],
  lastLogin: { type: Date },
  githubId: { type: String, unique: true, sparse: true },
  linkedinId: { type: String, unique: true, sparse: true },
  githubAccessToken: { type: String },
  linkedinAccessToken: { type: String },
  uploadedFiles: [{ 
    name: { type: String },
    url: { type: String }
  }],
  bio: { type: String, default: '', maxlength: 500 },
  skills: [{ type: String }],
  socialProfiles: [
    {
      platformName: { type: String },
      username: { type: String },
      link: { type: String }
    }
  ],
  followers: [{ 
    userId: { type: String },
    followedAt: { type: Date, default: Date.now }
  }],
  following: [{ 
    userId: { type: String },
    followedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Hash password before saving (only for non-OAuth users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method (for non-OAuth users)
userSchema.methods.comparePassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;