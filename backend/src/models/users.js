import mongoose from "mongoose";

const tags = { type: [String], default: [] };
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["citizen", "ngo", "university", "industry", "admin"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: String,
    address: String,
    ngoDetails: {
      areaOfWork: String,
      registrationNumber: String,
      yearsActive: Number,
    },
    universityDetails: {
      departments: tags,
      expertise: tags,
      labsResources: tags,
      interestedDomains: tags,
    },
    industryDetails: {
      industryType: String,
      expertise: tags,
      resourcesOffered: tags,
      interestedDomains: tags,
    },
  },
  { timestamps: true },
);
export default mongoose.model("User", userSchema);