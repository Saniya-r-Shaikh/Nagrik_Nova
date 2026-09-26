import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../supabase.js";

const router = express.Router();

const allowedRoles = ["citizen", "ngo", "university", "industry"];

const list = (value) =>
  Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);


// ===============================
// REGISTER
// ===============================
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      name,
      phone,
      address,

      // NGO
      ngoDetails,

      // University
      universityDetails,

      // Industry
      industryDetails,
    } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    // Basic validation
    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Choose a valid account type.",
      });
    }

    // Check whether email already exists
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError) {
      console.error("Supabase user check error:", existingError);
      return res.status(500).json({
        message: "Could not check existing account.",
      });
    }

    if (existingUser) {
      return res.status(409).json({
        message: "An account already exists with this email.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare role-specific information
    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      role,
      name: name.trim(),
      phone: phone || null,
      address: address || null,

      ngo_details:
        role === "ngo"
          ? {
              areaOfWork: list(ngoDetails?.areaOfWork),
              registrationNumber:
                ngoDetails?.registrationNumber || "",
              yearsActive:
                ngoDetails?.yearsActive || "",
            }
          : {},

      university_details:
        role === "university"
          ? {
              departments: list(universityDetails?.departments),
              expertise: list(universityDetails?.expertise),
              labsResources: list(
                universityDetails?.labsResources
              ),
              interestedDomains: list(
                universityDetails?.interestedDomains
              ),
            }
          : {},

      industry_details:
        role === "industry"
          ? {
              industryType: industryDetails?.industryType || "",
              expertise: list(industryDetails?.expertise),
              resourcesOffered: list(
                industryDetails?.resourcesOffered
              ),
              interestedDomains: list(
                industryDetails?.interestedDomains
              ),
            }
          : {},
    };

    // Insert user into Supabase
    const { data: savedUser, error: insertError } = await supabase
      .from("users")
      .insert(userData)
      .select("id, name, email, role, phone, address")
      .single();

    if (insertError) {
      console.error("Supabase registration error:", insertError);

      return res.status(500).json({
        message: "Could not create your account.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: savedUser.id,
        name: savedUser.name,
        role: savedUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: savedUser,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Something went wrong while creating your account.",
    });
  }
});


// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        password,
        role,
        phone,
        address,
        ngo_details,
        university_details,
        industry_details
        `
      )
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error("Supabase login query error:", userError);

      return res.status(500).json({
        message: "Could not process login.",
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Never send password to frontend
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      ngoDetails: user.ngo_details,
      universityDetails: user.university_details,
      industryDetails: user.industry_details,
    };

    return res.json({
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
});


export default router; 