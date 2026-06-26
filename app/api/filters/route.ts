import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/filters
// Returns the distinct values for all the filter dropdowns
// Used to populate the month, district, block, grade, and subject selectors
export async function GET() {
  try {
    console.log("Fetching filters from database...");
    // Get all the unique values for each filter in parallel
    const [months, districts, blocks, grades, subjects] = await Promise.all([
      prisma.schoolResponse.findMany({
        select: { reportingMonth: true },
        distinct: ["reportingMonth"],
        orderBy: { reportingMonth: "desc" },
      }),
      prisma.schoolResponse.findMany({
        select: { district: true },
        distinct: ["district"],
        orderBy: { district: "asc" },
      }),
      prisma.schoolResponse.findMany({
        select: { block: true },
        distinct: ["block"],
        orderBy: { block: "asc" },
      }),
      prisma.schoolResponse.findMany({
        select: { classesCovered: true },
        distinct: ["classesCovered"],
        where: { classesCovered: { not: "" } },
        orderBy: { classesCovered: "asc" },
      }),
      prisma.schoolResponse.findMany({
        select: { subject: true },
        distinct: ["subject"],
        where: { subject: { not: "" } },
        orderBy: { subject: "asc" },
      }),
    ]);

    // Pull out just the values from the results
    const filters = {
      months: months.map((m) => m.reportingMonth).filter(Boolean),
      districts: districts.map((d) => d.district).filter(Boolean),
      blocks: blocks.map((b) => b.block).filter(Boolean),
      grades: grades.map((g) => g.classesCovered).filter(Boolean),
      subjects: subjects.map((s) => s.subject).filter(Boolean),
    };

    console.log("Filters fetched successfully:", { months: filters.months.length, districts: filters.districts.length });
    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters. Make sure the database is seeded with npm run db:seed" },
      { status: 500 }
    );
  }
}
