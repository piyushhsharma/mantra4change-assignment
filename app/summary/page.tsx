"use client";

// Monthly review summary page - structured review with achievements, risks, and discussion points
import { useEffect, useState } from "react";
import Link from "next/link";

interface SchoolResponse {
  id: string;
  reportingMonth: string;
  schoolName: string;
  district: string;
  block: string;
  pblConducted: boolean;
  evidenceSubmitted: boolean;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: string;
}

interface PriorityArea {
  name: string;
  type: "district" | "block";
  riskStatus: string;
  enrollment: number;
  attendanceRate: number;
  reason: string;
}

export default function SummaryPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch available months
  useEffect(() => {
    fetch("/api/filters")
      .then((res) => res.json())
      .then((data) => {
        setMonths(data.months);
        if (data.months.length > 0) {
          setSelectedMonth(data.months[data.months.length - 1]);
        }
      })
      .catch((error) => console.error("Error fetching filters:", error))
      .finally(() => setLoading(false));
  }, []);

  // Generate summary when month changes
  useEffect(() => {
    if (!selectedMonth) return;

    const params = new URLSearchParams();
    params.append("month", selectedMonth);

    fetch(`/api/schools?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const responses = data.data;
        const kpis = data.kpis;
        const deltas = data.deltas;

        // Calculate district performance
        const districtMap = new Map<string, any>();
        responses.forEach((school: SchoolResponse) => {
          const existing = districtMap.get(school.district) || {
            district: school.district,
            totalSchools: 0,
            totalEnrollment: 0,
            totalAttendance: 0,
            riskCounts: { "On Track": 0, "Behind": 0, "At Risk": 0, "Critical": 0 },
          };
          existing.totalSchools++;
          existing.totalEnrollment += school.totalEnrollment;
          existing.totalAttendance += school.totalAttendance;
          existing.riskCounts[school.riskStatus as keyof typeof existing.riskCounts]++;
          districtMap.set(school.district, existing);
        });

        const districtData = Array.from(districtMap.values()).map((d: any) => {
          const attendanceRate = d.totalEnrollment > 0 ? d.totalAttendance / d.totalEnrollment : 0;
          const dominantRisk = Object.entries(d.riskCounts).sort(
            (a, b) => (b[1] as number) - (a[1] as number)
          )[0][0];
          return {
            ...d,
            attendanceRate,
            riskStatus: dominantRisk,
          };
        });

        // Sort by risk severity
        const riskOrder = { "Critical": 4, "At Risk": 3, "Behind": 2, "On Track": 1 };
        districtData.sort((a, b) => riskOrder[b.riskStatus as keyof typeof riskOrder] - riskOrder[a.riskStatus as keyof typeof riskOrder]);

        // Calculate priority areas
        const priorityData = districtData.slice(0, 5).map((d: any) => ({
          name: d.district,
          type: "district" as const,
          riskStatus: d.riskStatus,
          enrollment: d.totalEnrollment,
          attendanceRate: d.attendanceRate,
          reason: `${d.riskStatus} with ${d.totalSchools} schools at ${(d.attendanceRate * 100).toFixed(1)}% attendance`,
        }));

        // Count risk distribution
        const riskDistribution = responses.reduce((counts: any, school: SchoolResponse) => {
          counts[school.riskStatus] = (counts[school.riskStatus] || 0) + 1;
          return counts;
        }, {});

        setSummary({
          month: selectedMonth,
          kpis,
          deltas,
          districtData,
          priorityAreas: priorityData,
          riskDistribution,
        });
      })
      .catch((error) => console.error("Error generating summary:", error));
  }, [selectedMonth]);

  const getRiskColor = (riskStatus: string) => {
    switch (riskStatus) {
      case "On Track": return "bg-green-100 text-green-800";
      case "Behind": return "bg-yellow-100 text-yellow-800";
      case "At Risk": return "bg-orange-100 text-orange-800";
      case "Critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderDelta = (delta: any) => {
    if (!delta) return null;
    const color = delta.direction === "up" ? "text-green-600" : delta.direction === "down" ? "text-red-600" : "text-gray-500";
    const arrow = delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "→";
    return (
      <span className={`text-sm ${color}`}>
        {arrow} {delta.percentagePoints.toFixed(1)} pp
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading summary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Monthly Review Summary</h1>
              <p className="text-slate-600 text-sm">Structured monthly program review</p>
            </div>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Month Selector */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {summary && (
          <div className="space-y-6">
            {/* Achievements */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Achievements</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <div className="font-medium text-slate-900">
                      {summary.kpis.totalSchools} schools participated in PBL
                    </div>
                    <div className="text-sm text-slate-600">
                      {(summary.kpis.participationRate * 100).toFixed(1)}% participation rate
                      {renderDelta(summary.deltas.participationRate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <div className="font-medium text-slate-900">
                      {summary.kpis.totalEnrollment.toLocaleString()} students enrolled
                    </div>
                    <div className="text-sm text-slate-600">
                      {summary.kpis.totalAttendance.toLocaleString()} total attendances recorded
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <div className="font-medium text-slate-900">
                      {(summary.kpis.evidenceSubmissionRate * 100).toFixed(1)}% evidence submission rate
                    </div>
                    <div className="text-sm text-slate-600">
                      Schools submitting evidence for PBL projects
                      {renderDelta(summary.deltas.evidenceSubmissionRate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Month-over-Month Changes */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Month-over-Month Changes</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Participation Rate</div>
                  <div className="text-lg font-bold text-slate-900">
                    {(summary.kpis.participationRate * 100).toFixed(1)}%
                  </div>
                  {renderDelta(summary.deltas.participationRate)}
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Evidence Submission Rate</div>
                  <div className="text-lg font-bold text-slate-900">
                    {(summary.kpis.evidenceSubmissionRate * 100).toFixed(1)}%
                  </div>
                  {renderDelta(summary.deltas.evidenceSubmissionRate)}
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Attendance Rate</div>
                  <div className="text-lg font-bold text-slate-900">
                    {(summary.kpis.attendanceRate * 100).toFixed(1)}%
                  </div>
                  {renderDelta(summary.deltas.attendanceRate)}
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["On Track", "Behind", "At Risk", "Critical"].map((risk) => (
                  <div key={risk} className="p-4 bg-slate-50 rounded-md">
                    <div className="text-sm text-slate-600 mb-1">{risk}</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {summary.riskDistribution[risk] || 0}
                    </div>
                    <div className="text-xs text-slate-500">
                      {((summary.riskDistribution[risk] || 0) / summary.kpis.totalSchools * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risks */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Risk Areas</h2>
              <div className="space-y-3">
                {summary.districtData
                  .filter((d: any) => d.riskStatus === "Critical" || d.riskStatus === "At Risk")
                  .slice(0, 5)
                  .map((district: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{district.district}</div>
                        <div className="text-sm text-slate-600">
                          {district.totalSchools} schools • {(district.attendanceRate * 100).toFixed(1)}% attendance
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${getRiskColor(district.riskStatus)}`}
                      >
                        {district.riskStatus}
                      </span>
                    </div>
                  ))}
                {summary.districtData.filter((d: any) => d.riskStatus === "Critical" || d.riskStatus === "At Risk").length === 0 && (
                  <div className="text-sm text-slate-500">No critical or at-risk districts identified</div>
                )}
              </div>
            </div>

            {/* Priority Districts */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Priority Follow-Up Districts</h2>
              <div className="space-y-3">
                {summary.priorityAreas.map((area: PriorityArea, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-md border-l-4"
                    style={{ borderColor: getRiskColor(area.riskStatus).replace("text-", "bg-").replace("800", "600") }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900">{area.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${getRiskColor(area.riskStatus)}`}
                      >
                        {area.riskStatus}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{area.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Discussion Points */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Discussion Points</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="font-medium text-blue-900 mb-2">Strengths to Build On</div>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>High participation rate indicates strong school engagement</li>
                    <li>Evidence submission shows documentation practices are being followed</li>
                    <li>Districts with "On Track" status can serve as learning models</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                  <div className="font-medium text-orange-900 mb-2">Areas Requiring Attention</div>
                  <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                    <li>Districts with "Critical" or "At Risk" status need immediate support</li>
                    <li>Attendance gaps may indicate scheduling or engagement issues</li>
                    <li>Consider targeted interventions for underperforming blocks</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                  <div className="font-medium text-purple-900 mb-2">Recommended Actions</div>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>Schedule follow-up visits with priority districts</li>
                    <li>Share best practices from high-performing schools</li>
                    <li>Review resource allocation for at-risk areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
