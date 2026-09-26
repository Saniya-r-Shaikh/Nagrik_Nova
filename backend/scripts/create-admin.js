import "dotenv/config";
import bcrypt from "bcryptjs";
import supabase from "../src/supabase.js";

const email = "admin@nagriknova.com";
const password = "Admin@12345";

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: existingAdmin, error: checkError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingAdmin) {
      console.log("User already exists:");

      console.log({
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role,
      });

      if (existingAdmin.role !== "admin") {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: "admin",
          })
          .eq("id", existingAdmin.id);

        if (updateError) {
          throw updateError;
        }

        console.log("Existing user has been promoted to admin.");
      }

      return;
    }

    const { data: admin, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        role: "admin",
        name: "Nagrik Nova Admin",
        phone: null,
        address: null,
        ngo_details: {},
        university_details: {},
        industry_details: {},
      })
      .select("id, email, role, name")
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("Admin created successfully!");
    console.log(admin);
    console.log("");
    console.log("Admin login:");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Failed to create admin:");
    console.error(error);
    process.exit(1);
  }
}

createAdmin();