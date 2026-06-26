import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  participationRate,
  evidenceSubmissionRate,
  totalEnrollment,
  totalAttendance,
  overallAttendanceRate,
  monthOverMonthDelta,
  groupByField,
} from "@/lib/engine/metrics";

// GET /api/schools
// Returns filtered school data with KPIs and month-over-month changes
// Query params: month, district, block, grade, subject
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const district = searchParams.get("district");
  const block = searchParams.get("block");
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");

  console.log("[Schools API] Request params:", { month, district, block, grade, subject });

  // Build the filter based on what params were passed
  const where: any = {};
  if (month) where.reportingMonth = month;
  if (district) where.district = district;
  if (block) where.block = block;
  if (subject) where.subject = subject;
  if (grade) where.classesCovered = { contains: grade };

  try {
    // Get the school data from the database
    const responses = await prisma.schoolResponse.findMany({
      where,
      orderBy: { reportingMonth: "asc" },
    });

    // If nothing found, return empty results
    if (responses.length === 0) {
      console.log("[Schools API] No data found for filters:", where);
      return NextResponse.json({
        data: [],
        kpis: {
          totalSchools: 0,
          participationRate: 0,
          evidenceSubmissionRate: 0,
          totalEnrollment: 0,
          totalAttendance: 0,
          attendanceRate: 0,
        },
        deltas: {
          participationRate: null,
          evidenceSubmissionRate: null,
          attendanceRate: null,
        },
      });
    }

    // Calculate the KPIs using our engine functions
    const kpis = {
      totalSchools: responses.length,
      participationRate: participationRate(responses),
      evidenceSubmissionRate: evidenceSubmissionRate(responses),
      totalEnrollment: totalEnrollment(responses),
      totalAttendance: totalAttendance(responses),
      attendanceRate: overallAttendanceRate(responses),
    };

    // Calculate month-over-month changes if we have a specific month
    let deltas: {
      participationRate: { value: number; direction: "up" | "down" | "flat"; percentagePoints: number } | null;
      evidenceSubmissionRate: { value: number; direction: "up" | "down" | "flat"; percentagePoints: number } | null;
      attendanceRate: { value: number; direction: "up" | "down" | "flat"; percentagePoints: number } | null;
    } = {
      participationRate: null,
      evidenceSubmissionRate: null,
      attendanceRate: null,
    };

    if (month) {
      // Get previous month's data for comparison
      const monthParts = month.split("-");
      if (monthParts.length === 2) {
        const year = parseInt(monthParts[0]);
        const monthNum = parseInt(monthParts[1]);
        
        // Calculate previous month
        let prevYear = year;
        let prevMonth = monthNum - 1;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = year - 1;
        }
        
        const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
        
        // Fetch previous month data with same filters (except month)
        const prevWhere: any = { ...where };
        prevWhere.reportingMonth = prevMonthStr;
        
        const prevResponses = await prisma.schoolResponse.findMany({
          where: prevWhere,
        });

        if (prevResponses.length > 0) {
          deltas = {
            participationRate: monthOverMonthDelta(
              kpis.participationRate,
              participationRate(prevResponses)
            ),
            evidenceSubmissionRate: monthOverMonthDelta(
              kpis.evidenceSubmissionRate,
              evidenceSubmissionRate(prevResponses)
            ),
            attendanceRate: monthOverMonthDelta(
              kpis.attendanceRate,
              overallAttendanceRate(prevResponses)
            ),
          };
        }
      }
    }

    console.log("[Schools API] Returning data:", { 
      schoolCount: responses.length, 
      kpis,
      deltas 
    });
    return NextResponse.json({
      data: responses,
      kpis,
      deltas,
    });
  } catch (error) {
    console.error("[Schools API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school data" },
      { status: 500 }
    );
  }
}
