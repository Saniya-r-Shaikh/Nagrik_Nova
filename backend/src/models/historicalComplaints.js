import mongoose from "mongoose";

const historicalComplaintSchema = new mongoose.Schema(
  {
    complaint_id: String,
    complaint_date: String,
    year: Number,
    month: Number,
    is_monsoon_season: Boolean,
    complaint_time_of_day: String,

    ward_code: String,
    ward_area: String,
    zone: String,
    ward_type: String,

    population_density: Number,
    ward_slum_percentage: Number,

    complaint_category: String,
    department_assigned: String,
    complaint_channel: String,
    severity: String,

    has_photo_evidence: Boolean,
    has_gps_location: Boolean,
    media_attention: Boolean,
    politically_sensitive: Boolean,

    complainant_type: String,
    property_type: String,
    repeat_complainant: Boolean,
    prior_complaints_count: Number,

    resolution_days: Number,
    num_reassignments: Number,
    complaint_status: String,

    contractor_category: String,
    work_quality_rating: Number,
    site_inspected: Boolean,
    defect_liability_claim: Boolean,

    estimated_cost_inr: Number,
    infrastructure_age_years: Number,
    months_since_last_maintained: Number,

    regional_labor_shortage: Number,
    local_unemployment_rate: Number,

    citizen_satisfied: Boolean,

    source: String,
    source_dataset: String,
  },
  {
    collection: "historicalComplaints",
    strict: false,
  }
);

export default mongoose.model(
  "HistoricalComplaint",
  historicalComplaintSchema
);