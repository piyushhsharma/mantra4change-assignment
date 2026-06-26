// These are helper functions to calculate various metrics from the school data
// They're pure functions - no side effects, just take input and return output

import { SchoolResponse } from "@prisma/client";

// What percentage of schools actually did the PBL activity?
// Returns a decimal (0.85 = 85%)
export function participationRate(responses: SchoolResponse[]): number {
  if (responses.length === 0) return 0;
  const conductedCount = responses.filter(r => r.pblConducted).length;
  return conductedCount / responses.length;
}

// What percentage of schools uploaded evidence (photos, etc.) for their PBL work?
export function evidenceSubmissionRate(responses: SchoolResponse[]): number {
  if (responses.length === 0) return 0;
  const evidenceCount = responses.filter(r => r.evidenceSubmitted).length;
  return evidenceCount / responses.length;
}

// Add up all the students across all schools
export function totalEnrollment(responses: SchoolResponse[]): number {
  return responses.reduce((sum, r) => sum + r.totalEnrollment, 0);
}

// Add up all the attendances across all PBL sessions
export function totalAttendance(responses: SchoolResponse[]): number {
  return responses.reduce((sum, r) => sum + r.totalAttendance, 0);
}

// Overall attendance rate = total attendances / total enrollments
export function overallAttendanceRate(responses: SchoolResponse[]): number {
  const totalEnroll = totalEnrollment(responses);
  const totalAttend = totalAttendance(responses);
  if (totalEnroll === 0) return 0;
  return totalAttend / totalEnroll;
}

// Compare this month vs last month - did things get better or worse?
// Returns the change, direction (up/down/flat), and the percentage point difference
export function monthOverMonthDelta(
  currentMonthValue: number,
  previousMonthValue: number
): { value: number; direction: "up" | "down" | "flat"; percentagePoints: number } {
  const value = currentMonthValue - previousMonthValue;
  const percentagePoints = Math.abs(value) * 100;
  
  // Tiny changes (less than 0.1%) we treat as flat to avoid noise
  const threshold = 0.001;
  
  if (Math.abs(value) < threshold) {
    return { value: 0, direction: "flat", percentagePoints: 0 };
  }
  
  return {
    value,
    direction: value > 0 ? "up" : "down",
    percentagePoints
  };
}

// Group schools by district, block, or whatever field you want
// Useful for aggregating data at different levels
export function groupByField(
  responses: SchoolResponse[],
  field: keyof SchoolResponse
): Record<string, SchoolResponse[]> {
  return responses.reduce((groups, response) => {
    const key = String(response[field]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(response);
    return groups;
  }, {} as Record<string, SchoolResponse[]>);
}
