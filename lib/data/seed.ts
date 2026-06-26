// This script loads CSV data into the database
// Run with: npm run db:seed
// Make sure you have the CSV files in /data first!

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

// Safe integer parsing - returns 0 if invalid
function parseSafeInt(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Safe float parsing - returns 0 if invalid
function parseSafeFloat(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// Convert Yes/No to boolean
function parseYesNo(value: string): boolean {
  return value?.toLowerCase() === "yes";
}

// The CSV files have long question headers like "What is the name of your district?"
// We need to map these to our database field names like "district"
const SCHOOL_HEADER_MAPPING: Record<string, keyof any> = {
  "What is the name of your district?": "district",
  "What is your school's synthetic school code?": "schoolCode",
  "What is the name of your school?": "schoolName",
  "What is the name of your block?": "block",
  "Was the PBL project conducted in your school this month?": "pblConducted",
  "Was evidence submitted for the completed PBL project?": "evidenceSubmitted",
  "Which classes were covered in the PBL project?": "classesCovered",
  "Which subject was the PBL project focused on?": "subject",
  "Enrollment in Class 6": "enrollClass6",
  "Attendance in Class 6 Science PBL session": "attendanceClass6Science",
  "Attendance in Class 6 Math PBL session": "attendanceClass6Math",
  "Enrollment in Class 7": "enrollClass7",
  "Attendance in Class 7 Science PBL session": "attendanceClass7Science",
  "Attendance in Class 7 Math PBL session": "attendanceClass7Math",
  "Enrollment in Class 8": "enrollClass8",
  "Attendance in Class 8 Science PBL session": "attendanceClass8Science",
  "Attendance in Class 8 Math PBL session": "attendanceClass8Math",
  "Derived: Total enrollment across Classes 6-8": "totalEnrollment",
  "Derived: Total attendance across PBL Science and Math sessions": "totalAttendance",
  "Derived: Overall PBL attendance rate": "attendanceRate",
  "Derived: Risk status": "riskStatus",
  "Timestamp": "timestamp",
};

// Load school response data from CSV and save to database
async function seedSchoolResponses(filePath: string, reportingMonth: string): Promise<void> {
  console.log(`Processing school responses from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`  Found ${records.length} records`);

  for (const record of records) {
    try {
      // Check if PBL was conducted
      const pblConducted = parseYesNo(record["Was the PBL project conducted in your school this month?"]);
      
      // Skip invalid rows (no school name or marked as not applicable)
      if (!record["What is the name of your school?"] || record["What is the name of your school?"] === "Not applicable") {
        continue;
      }

      const schoolResponse = await prisma.schoolResponse.create({
        data: {
          reportingMonth,
          timestamp: record["Timestamp"] || new Date().toISOString(),
          schoolName: record["What is the name of your school?"] || "",
          schoolCode: record["What is your school's synthetic school code?"] || "",
          district: record["What is the name of your district?"] || "",
          block: record["What is the name of your block?"] || "",
          pblConducted,
          evidenceSubmitted: parseYesNo(record["Was evidence submitted for the completed PBL project?"]),
          classesCovered: record["Which classes were covered in the PBL project?"] || "",
          subject: record["Which subject was the PBL project focused on?"] || "",
          enrollClass6: parseSafeInt(record["Enrollment in Class 6"]),
          attendanceClass6Science: parseSafeInt(record["Attendance in Class 6 Science PBL session"]),
          attendanceClass6Math: parseSafeInt(record["Attendance in Class 6 Math PBL session"]),
          enrollClass7: parseSafeInt(record["Enrollment in Class 7"]),
          attendanceClass7Science: parseSafeInt(record["Attendance in Class 7 Science PBL session"]),
          attendanceClass7Math: parseSafeInt(record["Attendance in Class 7 Math PBL session"]),
          enrollClass8: parseSafeInt(record["Enrollment in Class 8"]),
          attendanceClass8Science: parseSafeInt(record["Attendance in Class 8 Science PBL session"]),
          attendanceClass8Math: parseSafeInt(record["Attendance in Class 8 Math PBL session"]),
          totalEnrollment: parseSafeInt(record["Derived: Total enrollment across Classes 6-8"]),
          totalAttendance: parseSafeInt(record["Derived: Total attendance across PBL Science and Math sessions"]),
          attendanceRate: parseSafeFloat(record["Derived: Overall PBL attendance rate"]),
          riskStatus: record["Derived: Risk status"] || "Unknown",
        },
      });
      
      console.log(`  ✓ Created school response: ${schoolResponse.schoolName}`);
    } catch (error) {
      console.error(`  ✗ Error creating school response:`, error);
      // Keep going even if one record fails
    }
  }
}

// Load grant finance data from CSV
async function seedGrantFinance(filePath: string): Promise<void> {
  console.log(`Processing grant finance from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`  Found ${records.length} records`);

  for (const record of records) {
    try {
      await prisma.grantFinance.create({
        data: {
          grantId: record["grant_id"] || "",
          donor: record["donor"] || "",
          grantName: record["grant_name"] || "",
          periodStart: record["period_start"] || "",
          periodEnd: record["period_end"] || "",
          coveredDistricts: record["covered_districts"] || "",
          reportingMonth: record["reporting_month"] || "",
          budgetLine: record["budget_line"] || "",
          approvedBudgetUnits: parseSafeInt(record["approved_budget_units"]),
          monthlyUtilizedUnits: parseSafeInt(record["monthly_utilized_units"]),
          cumulativeUtilizedUnits: parseSafeInt(record["cumulative_utilized_units"]),
          cumulativeUtilizationRate: parseSafeFloat(record["cumulative_utilization_rate"]),
          financeNote: record["finance_note"] || null,
        },
      });
      
      console.log(`  ✓ Created grant finance record: ${record["grant_name"]}`);
    } catch (error) {
      console.error(`  ✗ Error creating grant finance:`, error);
    }
  }
}

// Load grant performance data from CSV
async function seedGrantPerformance(filePath: string): Promise<void> {
  console.log(`Processing grant performance from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`  Found ${records.length} records`);

  for (const record of records) {
    try {
      await prisma.grantPerformance.create({
        data: {
          grantId: record["grant_id"] || "",
          donor: record["donor"] || "",
          grantName: record["grant_name"] || "",
          reportingMonth: record["reporting_month"] || "",
          periodEndDate: record["period_end_date"] || "",
          reportDueDate: record["report_due_date"] || "",
          reportStatus: record["report_status"] || "",
          coveredDistricts: record["covered_districts"] || "",
          sampledSchoolRecords: parseSafeInt(record["sampled_school_records"]),
          schoolsCompletedPbl: parseSafeInt(record["schools_completed_pbl"]),
          pblCompletionRate: parseSafeFloat(record["pbl_completion_rate"]),
          schoolsWithEvidence: parseSafeInt(record["schools_with_evidence"]),
          evidenceSubmissionRate: parseSafeFloat(record["evidence_submission_rate"]),
          totalEnrollment: parseSafeInt(record["total_enrollment"]),
          totalAttendance: parseSafeInt(record["total_attendance"]),
          attendanceRate: parseSafeFloat(record["attendance_rate"]),
          riskStatus: record["risk_status"] || "",
          milestoneSummary: record["milestone_summary"] || null,
          draftReportText: record["draft_report_text"] || null,
        },
      });
      
      console.log(`  ✓ Created grant performance record: ${record["grant_name"]}`);
    } catch (error) {
      console.error(`  ✗ Error creating grant performance:`, error);
    }
  }
}

// Load evidence/media data from CSV
async function seedEvidenceMedia(filePath: string): Promise<void> {
  console.log(`Processing evidence media from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`  Found ${records.length} records`);

  for (const record of records) {
    try {
      await prisma.evidenceMedia.create({
        data: {
          recordId: record["record_id"] || "",
          recordType: record["record_type"] || "",
          grantId: record["grant_id"] || "",
          donor: record["donor"] || "",
          reportingMonth: record["reporting_month"] || "",
          district: record["district"] || "",
          title: record["title"] || "",
          summaryOrCaption: record["summary_or_caption"] || "",
          fileName: record["file_name"] || "",
          relativePath: record["relative_path"] || "",
          usageNote: record["usage_note"] || null,
        },
      });
      
      console.log(`  ✓ Created evidence media record: ${record["title"]}`);
    } catch (error) {
      console.error(`  ✗ Error creating evidence media:`, error);
    }
  }
}

/**
 * Main seed function
 */
async function main() {
  const dataDir = path.join(process.cwd(), "data");
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.error("❌ ERROR: /data directory does not exist.");
    console.error("Please create the /data directory and add the required CSV files:");
    console.error("  - PBL_School_Response_Data_July_2025.csv");
    console.error("  - PBL_School_Response_Data_August_2025.csv");
    console.error("  - PBL_School_Response_Data_September_2025.csv");
    console.error("  - 01_Grant_Profile_and_Finance.csv");
    console.error("  - 02_Grant_Performance_and_Report_Material.csv");
    console.error("  - 03_Evidence_and_Media_Index.csv");
    process.exit(1);
  }

  // Check if data directory is empty
  const files = fs.readdirSync(dataDir);
  if (files.length === 0 || files.length === 1 && files[0] === ".gitkeep") {
    console.error("❌ ERROR: /data directory is empty.");
    console.error("Please add the required CSV files to the /data directory:");
    console.error("  - PBL_School_Response_Data_July_2025.csv");
    console.error("  - PBL_School_Response_Data_August_2025.csv");
    console.error("  - PBL_School_Response_Data_September_2025.csv");
    console.error("  - 01_Grant_Profile_and_Finance.csv");
    console.error("  - 02_Grant_Performance_and_Report_Material.csv");
    console.error("  - 03_Evidence_and_Media_Index.csv");
    process.exit(1);
  }

  console.log("🌱 Starting database seed...");
  console.log("");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.evidenceMedia.deleteMany();
  await prisma.grantPerformance.deleteMany();
  await prisma.grantFinance.deleteMany();
  await prisma.schoolResponse.deleteMany();
  console.log("✓ Cleared existing data");
  console.log("");

  // Seed school responses
  await seedSchoolResponses(
    path.join(dataDir, "PBL_School_Response_Data_July_2025.csv"),
    "2025-07"
  );
  await seedSchoolResponses(
    path.join(dataDir, "PBL_School_Response_Data_August_2025.csv"),
    "2025-08"
  );
  await seedSchoolResponses(
    path.join(dataDir, "PBL_School_Response_Data_September_2025.csv"),
    "2025-09"
  );

  // Seed grant data
  await seedGrantFinance(path.join(dataDir, "01_Grant_Profile_and_Finance.csv"));
  await seedGrantPerformance(path.join(dataDir, "02_Grant_Performance_and_Report_Material.csv"));
  await seedEvidenceMedia(path.join(dataDir, "03_Evidence_and_Media_Index.csv"));

  console.log("");
  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
