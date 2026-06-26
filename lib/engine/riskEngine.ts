// Risk thresholds - these are based on what the program team decided makes sense
// 75%+ = good, 60-74% = needs attention, 35-59% = concerning, below 35% = urgent
// Note: these thresholds can be adjusted based on program requirements
export function classifyRisk(rate: number): "On Track" | "Behind" | "At Risk" | "Critical" {
  if (rate >= 0.75) return "On Track";
  if (rate >= 0.60) return "Behind";
  if (rate >= 0.35) return "At Risk";
  return "Critical";
}

// Convert risk status to a number so we can sort by severity
// Critical = 4 (worst), On Track = 1 (best)
// Used for sorting districts/blocks by priority
export function getRiskSeverityScore(riskStatus: string): number {
  switch (riskStatus) {
    case "Critical": return 4;
    case "At Risk": return 3;
    case "Behind": return 2;
    case "On Track": return 1;
    default: return 0;
  }
}
