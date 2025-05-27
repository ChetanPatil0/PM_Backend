import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    price: { type: Number },
    rating: { type: Number, default: 0 },
    buyers: [{ type: String }],
    collegeDetails: {
      collegeId: { type: String },
      collegeName: { type: String },
    },
    tags: [{ type: String }],
    techStack: [{ type: String }],
    sourceCode: { type: String },
    thumbnail: { type: String },
    images: [{ type: String }],
    video: { type: String },
    otherFiles: [{ type: String }],
    projectType: { type: String },
    status: { type: String, default: "Active" },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    teamMembers: [
      {
        user: { type: String },
        role: { type: String },
      },
    ],
    collaborationRequests: [
      {
        userId: { type: String, required: true },
        message: { type: String },
        status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    logs: [
      {
        action: { type: String, required: true },
        userId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;