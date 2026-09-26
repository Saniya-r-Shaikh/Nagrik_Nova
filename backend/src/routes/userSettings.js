import express from "express";
import bcrypt from "bcryptjs";

import supabase from "../supabase.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// All user settings routes require login
router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| GET /api/users/:id
| Fetch current user's profile
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    // Users can only fetch their own account
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        message: "You are not allowed to access this account.",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, name, role, phone, address, ngo_details, university_details, industry_details, created_at, updated_at"
      )
      .eq("id", req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      message: "Server error fetching user.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| PUT /api/users/:id
| Update profile
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  try {
    // Only the logged-in user can update their own account
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        message: "You are not allowed to update this account.",
      });
    }

    const {
      name,
      email,
      phone,
      address,
    } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    /*
    Check whether another account already uses this email.
    */
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .neq("id", req.params.id)
      .maybeSingle();

    if (existingError) {
      console.error("EMAIL CHECK ERROR:", existingError);

      return res.status(500).json({
        message: "Could not verify email address.",
      });
    }

    if (existingUser) {
      return res.status(409).json({
        message: "This email address is already being used by another account.",
      });
    }

    /*
    Update only profile fields.
    Password is intentionally NOT updated here.
    */
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select(
        "id, email, name, role, phone, address, ngo_details, university_details, industry_details, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("PROFILE UPDATE ERROR:", error);

      return res.status(500).json({
        message: "Server error updating profile.",
      });
    }

    res.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    res.status(500).json({
      message: "Server error updating profile.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| PUT /api/users/:id/password
| Change password
|--------------------------------------------------------------------------
*/
router.put("/:id/password", async (req, res) => {
  try {
    // Only the logged-in user can change their own password
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        message: "You are not allowed to change this password.",
      });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    /*
    Hash password using bcrypt.
    Your current project uses bcryptjs.
    */
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id);

    if (error) {
      console.error("PASSWORD UPDATE ERROR:", error);

      return res.status(500).json({
        message: "Server error updating password.",
      });
    }

    res.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("PASSWORD ERROR:", error);

    res.status(500).json({
      message: "Server error updating password.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| DELETE /api/users/:id
| Delete account
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    // Only the logged-in user can delete their own account
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        message: "You are not allowed to delete this account.",
      });
    }

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) {
      console.error("DELETE USER CHECK ERROR:", findError);

      return res.status(500).json({
        message: "Could not verify account.",
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    /*
    Delete the user.
    
    Your current database uses foreign-key relationships such as
    submitted_by -> users.id ON DELETE SET NULL for issues,
    so existing civic issues can remain without the deleted user
    attached to them.
    */
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);

    if (deleteError) {
      console.error("DELETE USER ERROR:", deleteError);

      return res.status(500).json({
        message: "Server error deleting account.",
      });
    }

    res.json({
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    res.status(500).json({
      message: "Server error deleting account.",
    });
  }
});

export default router;