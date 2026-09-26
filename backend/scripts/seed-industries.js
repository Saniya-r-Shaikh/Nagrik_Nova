import "dotenv/config";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { parse } from "csv-parse/sync";
import supabase from "../src/supabase.js";

const csvPath = path.join(
  process.cwd(),
  "data",
  "industries.csv"
);

const csv = fs.readFileSync(csvPath, "utf8");

const industries = parse(csv, {
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
  return `NNIndustry@2026-${String(index + 1).padStart(3, "0")}`;
}

async function seedIndustries() {
  console.log(`Found ${industries.length} industries.\n`);

  const credentials = [];

  for (let i = 0; i < industries.length; i++) {
    const industry = industries[i];

    const email = makeEmail(
      industry.organization_name,
      i
    );

    // Check if account already exists
    const { data: existing, error: existingError } =
      await supabase
        .from("users")
        .select("id, email, name, role, industry_details")
        .eq("name", industry.organization_name)
        .eq("role", "industry")
        .maybeSingle();

    if (existingError) {
      console.error(
        `Could not check ${industry.organization_name}:`,
        existingError.message
      );
      continue;
    }

    if (existing) {
      console.log(
        `SKIPPED: ${industry.organization_name}`
      );
      console.log(
        `        Existing account: ${existing.email}\n`
      );

      credentials.push({
        organization: industry.organization_name,
        email: existing.email,
        password: "",
        status: "Already exists",
      });

      continue;
    }

    // Only new industry accounts get a password
    const password = makePassword(i);

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const industryDetails = {
      demo_account: true,

      industryType:
        industry.organization_type || null,

      city: industry.city || null,

      state: industry.state || null,

      expertise: industry.expertise
        ? industry.expertise
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      resourcesOffered: industry.facilities
        ? industry.facilities
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      interestedDomains: industry.civic_domains
        ? industry.civic_domains
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
        : [],

      source: industry.source || null,

      sourceUrl: industry.source_url || null,

      verificationStatus:
        industry.verification_status || null,

      notes: industry.notes || null,
    };

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: industry.organization_name,

        email,

        password: hashedPassword,

        role: "industry",

        phone: null,

        address: `${industry.city || ""}, ${industry.state || ""
          }`.trim(),

        industry_details: industryDetails,

        ngo_details: {},

        university_details: {},
      })
      .select("id, name, email, role")
      .single();

    if (error) {
      console.error(
        `FAILED: ${industry.organization_name}`
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
      organization: industry.organization_name,
      email,
      password,
      status: "Created",
    });
  }

  console.log(
    "\n=========================================="
  );
  console.log(
    "NAGRIK NOVA DEMO INDUSTRY ACCOUNTS"
  );
  console.log(
    "==========================================\n"
  );

  console.table(credentials);

  const credentialsPath = path.join(
    process.cwd(),
    "data",
    "industry-demo-credentials.json"
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
    "They do NOT represent official accounts of these companies."
  );
}

seedIndustries().catch((error) => {
  console.error("\nSeeding failed:");
  console.error(error);
  process.exit(1);
});