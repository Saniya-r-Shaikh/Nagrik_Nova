import mongoose from "mongoose";
const matchSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    role: String,
    expertise: [String],
  },
  { _id: false },
);
const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    state: {
      type: String,
      trim: true,
      required: true
    },

    city: {
      type: String,
      trim: true,
      required: true
    },
    street: {
      type: String,
      trim: true,
      required: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submitterRole: String,
    domain: String,
    priority: { type: String, enum: ["Low", "Medium", "High"] },
    requiredExpertise: [String],
    solutionIdea: String,
    matchedOrganizations: [matchSchema],
    analyzed: { type: Boolean, default: false },
    analyzedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export default mongoose.model("Issue", issueSchema);