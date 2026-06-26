// This module helps us figure out which districts/blocks need attention first
// We combine risk level with how many students are there to prioritize
// Higher risk + more students = higher priority

import { SchoolResponse } from "@prisma/client";
import { getRiskSeverityScore } from "./riskEngine";
import { overallAttendanceRate, totalEnrollment, groupByField } from "./metrics";

// Data structure for a prioritized area (district or block)
export interface PriorityArea {
  name: string;
  type: "district" | "block";
  riskStatus: string;
  riskSeverityScore: number;
  enrollment: number;
  attendanceRate: number;
  priorityScore: number;
  reason: string;
}

// Calculate a priority score - higher means more urgent
// Risk is the main factor, but enrollment matters too (bigger districts = bigger impact)
// Using log for enrollment so huge districts don't completely dominate
function calculatePriorityScore(riskSeverityScore: number, enrollment: number): number {
  // Risk score is the main driver (1-4 scaled to 100-400)
  const riskScore = riskSeverityScore * 100;
  
  // Enrollment factor - log10 so 100 students = 20, 1000 = 30, 10000 = 40
  // This way enrollment matters but doesn't overwhelm risk
  const enrollmentFactor = Math.log10(Math.max(enrollment, 1)) * 10;
  
  return riskScore + enrollmentFactor;
}

// Generate a human-readable explanation for why this area is prioritized
function generatePriorityReason(area: PriorityArea): string {
  const { riskStatus, enrollment, attendanceRate } = area;
  const attendancePercent = (attendanceRate * 100).toFixed(1);
  
  if (riskStatus === "Critical") {
    return `Critical risk with ${enrollment} students at ${attendancePercent}% attendance - urgent intervention needed`;
  }
  if (riskStatus === "At Risk") {
    return `At risk with ${enrollment} students at ${attendancePercent}% attendance - requires immediate support`;
  }
  if (riskStatus === "Behind") {
    return `Behind target with ${enrollment} students at ${attendancePercent}% attendance - monitor and provide assistance`;
  }
  return `On track with ${enrollment} students at ${attendancePercent}% attendance - maintain current support`;
}

// Rank all districts by priority - highest priority first
// Optional limit parameter if you only want the top N
export function rankDistrictsByPriority(
  responses: SchoolResponse[],
  limit?: number
): PriorityArea[] {
  const districtGroups = groupByField(responses, "district");
  
  const districts: PriorityArea[] = Object.entries(districtGroups).map(
    ([districtName, districtResponses]) => {
      // Figure out which risk status is most common in this district
      const riskCounts = districtResponses.reduce((counts, r) => {
        counts[r.riskStatus] = (counts[r.riskStatus] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const dominantRiskStatus = Object.entries(riskCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      
      const riskSeverityScore = getRiskSeverityScore(dominantRiskStatus);
      const enrollment = totalEnrollment(districtResponses);
      const attendanceRate = overallAttendanceRate(districtResponses);
      const priorityScore = calculatePriorityScore(riskSeverityScore, enrollment);
      
      return {
        name: districtName,
        type: "district" as const,
        riskStatus: dominantRiskStatus,
        riskSeverityScore,
        enrollment,
        attendanceRate,
        priorityScore,
        reason: generatePriorityReason({
          name: districtName,
          type: "district",
          riskStatus: dominantRiskStatus,
          riskSeverityScore,
          enrollment,
          attendanceRate,
          priorityScore,
          reason: "" // Will be filled by generatePriorityReason
        })
      };
    }
  );
  
  // Sort highest priority first
  districts.sort((a, b) => b.priorityScore - a.priorityScore);
  
  return limit ? districts.slice(0, limit) : districts;
}

// Same logic as districts but for blocks
export function rankBlocksByPriority(
  responses: SchoolResponse[],
  limit?: number
): PriorityArea[] {
  const blockGroups = groupByField(responses, "block");
  
  const blocks: PriorityArea[] = Object.entries(blockGroups).map(
    ([blockName, blockResponses]) => {
      // Figure out which risk status is most common in this block
      const riskCounts = blockResponses.reduce((counts, r) => {
        counts[r.riskStatus] = (counts[r.riskStatus] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const dominantRiskStatus = Object.entries(riskCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      
      const riskSeverityScore = getRiskSeverityScore(dominantRiskStatus);
      const enrollment = totalEnrollment(blockResponses);
      const attendanceRate = overallAttendanceRate(blockResponses);
      const priorityScore = calculatePriorityScore(riskSeverityScore, enrollment);
      
      return {
        name: blockName,
        type: "block" as const,
        riskStatus: dominantRiskStatus,
        riskSeverityScore,
        enrollment,
        attendanceRate,
        priorityScore,
        reason: generatePriorityReason({
          name: blockName,
          type: "block",
          riskStatus: dominantRiskStatus,
          riskSeverityScore,
          enrollment,
          attendanceRate,
          priorityScore,
          reason: ""
        })
      };
    }
  );
  
  // Sort highest priority first
  blocks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  return limit ? blocks.slice(0, limit) : blocks;
}

// Get the top N priority areas (mix of districts and blocks)
// Default is top 5, but you can ask for more or less
export function getTopPriorityAreas(
  responses: SchoolResponse[],
  topN: number = 5
): PriorityArea[] {
  const districts = rankDistrictsByPriority(responses);
  const blocks = rankBlocksByPriority(responses);
  
  // Combine both lists and sort by priority
  const combined = [...districts, ...blocks].sort(
    (a, b) => b.priorityScore - a.priorityScore
  );
  
  // Return just the top N
  return combined.slice(0, topN);
}
