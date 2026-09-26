import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
    
RAW_FILE = BACKEND_DIR / "data" / "raw" / "bmc_train.csv"
CLEANED_DIR = BACKEND_DIR / "data" / "cleaned"

CSV_OUTPUT = CLEANED_DIR / "nagriknova_historical_complaints.csv"
JSONL_OUTPUT = CLEANED_DIR / "nagriknova_historical_complaints.jsonl"


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

CLEANED_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# COLUMNS WE WANT
# ============================================================

SELECTED_COLUMNS = [
    # Identity / date
    "complaint_id",
    "complaint_date",
    "year",
    "month",
    "is_monsoon_season",
    "complaint_time_of_day",

    # Location
    "ward_code",
    "ward_area",
    "zone",
    "ward_type",
    "population_density",
    "ward_slum_percentage",

    # Complaint
    "complaint_category",
    "department_assigned",
    "complaint_channel",
    "severity",
    "has_photo_evidence",
    "has_gps_location",

    # Complainant / context
    "complainant_type",
    "property_type",
    "repeat_complainant",
    "prior_complaints_count",

    # Historical resolution
    "resolution_days",
    "num_reassignments",
    "complaint_status",
    "contractor_category",
    "work_quality_rating",
    "site_inspected",
    "defect_liability_claim",

    # Cost / infrastructure
    "estimated_cost_inr",
    "infrastructure_age_years",
    "months_since_last_maintained",

    # Outcome
    "citizen_satisfied",
]


# ============================================================
# LOAD DATA
# ============================================================

print("\n==========================================")
print("NAGRIK NOVA DATA CLEANING")
print("==========================================\n")

if not RAW_FILE.exists():
    print("ERROR:")
    print(f"Could not find:\n{RAW_FILE}")
    print("\nMake sure bmc_train.csv is inside:")
    print("backend/data/raw/")
    raise SystemExit(1)


print("Loading BMC training dataset...")
print(f"File: {RAW_FILE}\n")

df = pd.read_csv(
    RAW_FILE,
    low_memory=False
)

print(f"Original rows:    {len(df):,}")
print(f"Original columns: {len(df.columns)}")


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

missing_columns = [
    column
    for column in SELECTED_COLUMNS
    if column not in df.columns
]

if missing_columns:
    print("\nERROR: The following columns are missing:")
    for column in missing_columns:
        print(f" - {column}")

    raise SystemExit(1)


# ============================================================
# SELECT ONLY REQUIRED COLUMNS
# ============================================================

df = df[SELECTED_COLUMNS].copy()

print(f"\nColumns after selection: {len(df.columns)}")


# ============================================================
# REMOVE DUPLICATE COMPLAINT IDs
# ============================================================

before_duplicates = len(df)

df = df.drop_duplicates(
    subset=["complaint_id"],
    keep="first"
)

removed_duplicates = before_duplicates - len(df)

print(f"Duplicate records removed: {removed_duplicates:,}")


# ============================================================
# CLEAN STRING COLUMNS
# ============================================================

STRING_COLUMNS = [
    "complaint_id",
    "complaint_time_of_day",
    "ward_code",
    "ward_area",
    "zone",
    "ward_type",
    "population_density",
    "complaint_category",
    "department_assigned",
    "complaint_channel",
    "severity",
    "complainant_type",
    "property_type",
    "complaint_status",
    "contractor_category",
    "work_quality_rating",
]

for column in STRING_COLUMNS:
    df[column] = (
        df[column]
        .astype("string")
        .str.strip()
    )


# ============================================================
# DATE CLEANING
# ============================================================

df["complaint_date"] = pd.to_datetime(
    df["complaint_date"],
    errors="coerce"
)

# Store dates in YYYY-MM-DD format
df["complaint_date"] = df["complaint_date"].dt.strftime(
    "%Y-%m-%d"
)


# ============================================================
# NUMERIC COLUMNS
# ============================================================

NUMERIC_COLUMNS = [
    "year",
    "month",
    "ward_slum_percentage",
    "prior_complaints_count",
    "resolution_days",
    "num_reassignments",
    "estimated_cost_inr",
    "infrastructure_age_years",
    "months_since_last_maintained",
]

for column in NUMERIC_COLUMNS:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# BINARY COLUMNS
# ============================================================

BINARY_COLUMNS = [
    "is_monsoon_season",
    "has_photo_evidence",
    "has_gps_location",
    "repeat_complainant",
    "site_inspected",
    "defect_liability_claim",
    "citizen_satisfied",
]

for column in BINARY_COLUMNS:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# REMOVE RECORDS WITHOUT ESSENTIAL INFORMATION
# ============================================================

ESSENTIAL_COLUMNS = [
    "complaint_id",
    "complaint_date",
    "ward_code",
    "ward_area",
    "complaint_category",
]

before_required_filter = len(df)

df = df.dropna(
    subset=ESSENTIAL_COLUMNS
)

removed_missing = (
    before_required_filter - len(df)
)

print(
    f"Records removed due to missing essential data: "
    f"{removed_missing:,}"
)


# ============================================================
# NORMALIZE BINARY VALUES
# ============================================================

for column in BINARY_COLUMNS:
    df[column] = df[column].fillna(0).astype(int)


# ============================================================
# ADD DATASET METADATA
# ============================================================

df["source"] = "kaggle_bmc_synthetic"
df["source_dataset"] = (
    "Mumbai Nagar Seva BMC Civic Complaint "
    "Resolution 2018-2024"
)


# ============================================================
# REORDER COLUMNS
# ============================================================

FINAL_COLUMNS = [
    "complaint_id",
    "complaint_date",
    "year",
    "month",
    "is_monsoon_season",
    "complaint_time_of_day",

    "ward_code",
    "ward_area",
    "zone",
    "ward_type",
    "population_density",
    "ward_slum_percentage",

    "complaint_category",
    "department_assigned",
    "complaint_channel",
    "severity",
    "has_photo_evidence",
    "has_gps_location",

    "complainant_type",
    "property_type",
    "repeat_complainant",
    "prior_complaints_count",

    "resolution_days",
    "num_reassignments",
    "complaint_status",
    "contractor_category",
    "work_quality_rating",
    "site_inspected",
    "defect_liability_claim",

    "estimated_cost_inr",
    "infrastructure_age_years",
    "months_since_last_maintained",

    "citizen_satisfied",

    "source",
    "source_dataset",
]

df = df[FINAL_COLUMNS]


# ============================================================
# SAVE CLEAN CSV
# ============================================================

print("\nSaving cleaned CSV...")

df.to_csv(
    CSV_OUTPUT,
    index=False
)

print(f"Created:")
print(CSV_OUTPUT)


# ============================================================
# SAVE JSONL
# ============================================================

print("\nCreating JSONL file for MongoDB...")

df.to_json(
    JSONL_OUTPUT,
    orient="records",
    lines=True,
    force_ascii=False
)

print(f"Created:")
print(JSONL_OUTPUT)


# ============================================================
# SUMMARY
# ============================================================

print("\n==========================================")
print("CLEANING COMPLETE")
print("==========================================")

print(f"\nFinal rows:    {len(df):,}")
print(f"Final columns: {len(df.columns)}")

print("\nComplaint categories:")
print(
    df["complaint_category"]
    .value_counts()
    .to_string()
)

print("\nComplaint statuses:")
print(
    df["complaint_status"]
    .value_counts()
    .to_string()
)

print("\nTop wards:")
print(
    df["ward_area"]
    .value_counts()
    .head(10)
    .to_string()
)

print("\nFiles created:")
print(f"1. {CSV_OUTPUT}")
print(f"2. {JSONL_OUTPUT}")

print("\nNagrik Nova historical dataset is ready.")