-- CreateTable
CREATE TABLE "SchoolResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportingMonth" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "pblConducted" BOOLEAN NOT NULL,
    "evidenceSubmitted" BOOLEAN NOT NULL,
    "classesCovered" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "enrollClass6" INTEGER NOT NULL,
    "attendanceClass6Science" INTEGER NOT NULL,
    "attendanceClass6Math" INTEGER NOT NULL,
    "enrollClass7" INTEGER NOT NULL,
    "attendanceClass7Science" INTEGER NOT NULL,
    "attendanceClass7Math" INTEGER NOT NULL,
    "enrollClass8" INTEGER NOT NULL,
    "attendanceClass8Science" INTEGER NOT NULL,
    "attendanceClass8Math" INTEGER NOT NULL,
    "totalEnrollment" INTEGER NOT NULL,
    "totalAttendance" INTEGER NOT NULL,
    "attendanceRate" REAL NOT NULL,
    "riskStatus" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GrantFinance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "coveredDistricts" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "budgetLine" TEXT NOT NULL,
    "approvedBudgetUnits" INTEGER NOT NULL,
    "monthlyUtilizedUnits" INTEGER NOT NULL,
    "cumulativeUtilizedUnits" INTEGER NOT NULL,
    "cumulativeUtilizationRate" REAL NOT NULL,
    "financeNote" TEXT
);

-- CreateTable
CREATE TABLE "GrantPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "periodEndDate" TEXT NOT NULL,
    "reportDueDate" TEXT NOT NULL,
    "reportStatus" TEXT NOT NULL,
    "coveredDistricts" TEXT NOT NULL,
    "sampledSchoolRecords" INTEGER NOT NULL,
    "schoolsCompletedPbl" INTEGER NOT NULL,
    "pblCompletionRate" REAL NOT NULL,
    "schoolsWithEvidence" INTEGER NOT NULL,
    "evidenceSubmissionRate" REAL NOT NULL,
    "totalEnrollment" INTEGER NOT NULL,
    "totalAttendance" INTEGER NOT NULL,
    "attendanceRate" REAL NOT NULL,
    "riskStatus" TEXT NOT NULL,
    "milestoneSummary" TEXT,
    "draftReportText" TEXT
);

-- CreateTable
CREATE TABLE "EvidenceMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summaryOrCaption" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "usageNote" TEXT
);
