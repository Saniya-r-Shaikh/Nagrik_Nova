import "dotenv/config";
import supabase from "./src/supabase.js";

const { data, error } = await supabase
  .from("historical_complaints")
  .select("complaint_id, complaint_category, ward_area")
  .limit(1);

if (error) {
  console.error("Supabase query failed:");
  console.error(error);
  process.exit(1);
}

console.log("Supabase query successful!");
console.log(data);