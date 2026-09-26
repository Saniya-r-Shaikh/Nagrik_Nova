import "dotenv/config";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { parse } from "csv-parse/sync";
import supabase from "../src/supabase.js";

const csvPath = path.join(
  process.cwd(),
  "data",
  "organizations.csv"
);

const csv = fs.readFileSync(csvPath, "utf8");

const organizations = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
});

function makeEmail(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);

  return `${slug}.demo@nagriknova.com`;
}

function makePassword(index) {
  return `NNOrg@2026-${String(index + 1).padStart(3, "0")}`;
}

async function seedOrganizations() {
  console.log(`Found ${organizations.length} organizations.\n`);

  const credentials = [];

  for (let i = 0; i < organizations.length; i++) {
    const org = organizations[i];

    const email = makeEmail(org.organization_name, i);

    // Check whether this demo account already exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id, email, name, role, university_details")
      .eq("name", org.organization_name)
      .eq("role", "university")
      .maybeSingle();

    if (existingError) {
      console.error(
        `Could not check ${org.organization_name}:`,
        existingError.message
      );
      continue;
    }

    if (existing) {
      console.log(`SKIPPED: ${org.organization_name}`);
      console.log(`        Existing account: ${existing.email}\n`);

      credentials.push({
        organization: org.organization_name,
        email: existing.email,
        password: "",
        status: "Already exists",
      });

      continue;
    }

    const password = makePassword(i);


    const hashedPassword = await bcrypt.hash(password, 12);

    const universityDetails = {
      demo_account: true,

      organization_type: org.organization_type,

      city: org.city,
      state: org.state,

      expertise: org.expertise
        ? org.expertise
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      facilities: org.facilities
        ? org.facilities
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      civic_domains: org.civic_domains
        ? org.civic_domains
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      source: org.source || null,
      source_url: org.source_url || null,
      verification_status: org.verification_status || null,
      notes: org.notes || null,
    };

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: org.organization_name,
        email,
        password: hashedPassword,
        role: "university",

        phone: null,
        address: `${org.city || ""}, ${org.state || ""}`.trim(),

        university_details: universityDetails,

        ngo_details: {},
        industry_details: {},
      })
      .select("id, name, email, role")
      .single();

    if (error) {
      console.error(
        `FAILED: ${org.organization_name}`
      );
      console.error(error.message);
      console.log();

      continue;
    }

    console.log(`ADDED: ${data.name}`);
    console.log(`      Email: ${email}`);
    console.log(`      Password: ${password}`);
    console.log();

    credentials.push({
      organization: org.organization_name,
      email,
      password,
      status: "Created",
    });
  }

  console.log("\n========================================");
  console.log("NAGRIK NOVA DEMO ORGANIZATION ACCOUNTS");
  console.log("========================================\n");

  console.table(credentials);

  // Save credentials locally for development/demo use
  const credentialsPath = path.join(
    process.cwd(),
    "data",
    "organization-demo-credentials.json"
  );

  fs.writeFileSync(
    credentialsPath,
    JSON.stringify(credentials, null, 2)
  );

  console.log(
    `\nCredentials saved to: ${credentialsPath}`
  );

  console.log(
    "\nIMPORTANT: These are Nagrik Nova demo credentials."
  );
  console.log(
    "They do NOT represent official accounts of these institutions."
  );
}

seedOrganizations().catch((error) => {
  console.error("\nSeeding failed:");
  console.error(error);
  process.exit(1);
});