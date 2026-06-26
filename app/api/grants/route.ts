import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/grants
// Returns grant data from performance, finance, and evidence tables
// Query params: grantId, month
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const grantId = searchParams.get("grantId");
  const month = searchParams.get("month");

  console.log("Fetching grant data:", { grantId, month });

  try {
    // Build the filters for each table
    const performanceWhere: any = {};
    const financeWhere: any = {};
    const mediaWhere: any = {};

    if (grantId) {
      performanceWhere.grantId = grantId;
      financeWhere.grantId = grantId;
      mediaWhere.grantId = grantId;
    }
    if (month) {
      performanceWhere.reportingMonth = month;
      financeWhere.reportingMonth = month;
      mediaWhere.reportingMonth = month;
    }

    // Get all three tables in parallel
    const [performance, finance, media] = await Promise.all([
      prisma.grantPerformance.findMany({
        where: performanceWhere,
        orderBy: { reportingMonth: "desc" },
      }),
      prisma.grantFinance.findMany({
        where: financeWhere,
        orderBy: { reportingMonth: "desc" },
      }),
      prisma.evidenceMedia.findMany({
        where: mediaWhere,
        orderBy: { reportingMonth: "desc" },
      }),
    ]);

    console.log("Grant data fetched:", { performance: performance.length, finance: finance.length, media: media.length });
    return NextResponse.json({
      performance,
      finance,
      media,
    });
  } catch (error) {
    console.error("Error fetching grant data:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant data. Make sure the database is seeded with npm run db:seed" },
      { status: 500 }
    );
  }
}
