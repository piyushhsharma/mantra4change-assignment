"use client";

// Dashboard page - shows school data, KPIs, charts, and priority areas
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

interface KPIs {
  totalSchools: number;
  participationRate: number;
  evidenceSubmissionRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
}

interface Delta {
  value: number;
  direction: "up" | "down" | "flat";
  percentagePoints: number;
}

interface Filters {
  months: string[];
  districts: string[];
  blocks: string[];
  grades: string[];
  subjects: string[];
}

interface PriorityArea {
  name: string;
  type: "district" | "block";
  riskStatus: string;
  enrollment: number;
  attendanceRate: number;
  reason: string;
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({
    months: [],
    districts: [],
    blocks: [],
    grades: [],
    subjects: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({
    month: "",
    district: "",
    block: "",
    grade: "",
    subject: "",
  });

  const [schoolData, setSchoolData] = useState<SchoolResponse[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [deltas, setDeltas] = useState<{
    participationRate: Delta | null;
    evidenceSubmissionRate: Delta | null;
    attendanceRate: Delta | null;
  } | null>(null);

  const [districtPerformance, setDistrictPerformance] = useState<any[]>([]);
  const [priorityAreas, setPriorityAreas] = useState<PriorityArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch filter options on mount
  useEffect(() => {
    console.log("[Dashboard] Fetching filters...");
    fetch("/api/filters")
      .then((res) => {
        console.log("[Dashboard] Filters response status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("[Dashboard] Filters data received:", data);
        setFilters(data);
        if (data.months.length > 0) {
          setSelectedFilters((prev) => ({ ...prev, month: data.months[0] }));
        }
      })
      .catch((error) => {
        console.error("[Dashboard] Error fetching filters:", error);
        setError("Failed to load filters. Make sure the database is seeded.");
        setLoading(false);
      });
  }, []);

  // Fetch school data when filters change
  useEffect(() => {
    if (!selectedFilters.month) return;

    console.log("[Dashboard] Fetching school data with filters:", selectedFilters);
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedFilters.month) params.append("month", selectedFilters.month);
    if (selectedFilters.district) params.append("district", selectedFilters.district);
    if (selectedFilters.block) params.append("block", selectedFilters.block);
    if (selectedFilters.grade) params.append("grade", selectedFilters.grade);
    if (selectedFilters.subject) params.append("subject", selectedFilters.subject);

    fetch(`/api/schools?${params}`)
      .then((res) => {
        console.log("[Dashboard] Schools response status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("[Dashboard] Schools data received:", {
          schoolCount: data.data?.length,
          kpis: data.kpis,
        });
        setSchoolData(data.data);
        setKpis(data.kpis);
        setDeltas(data.deltas);

        // Calculate district performance
        const districtMap = new Map<string, any>();
        data.data.forEach((school: SchoolResponse) => {
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
          // Determine dominant risk status
          const dominantRisk = Object.entries(d.riskCounts).sort(
            (a, b) => (b[1] as number) - (a[1] as number)
          )[0][0];
          return {
            ...d,
            attendanceRate: (attendanceRate * 100).toFixed(1),
            riskStatus: dominantRisk,
          };
        });

        // Sort by risk severity
        const riskOrder = { Critical: 4, "At Risk": 3, Behind: 2, "On Track": 1 };
        districtData.sort(
          (a, b) =>
            riskOrder[b.riskStatus as keyof typeof riskOrder] -
            riskOrder[a.riskStatus as keyof typeof riskOrder]
        );

        setDistrictPerformance(districtData);

        // Calculate priority areas (top 5)
        const priorityData = districtData.slice(0, 5).map((d: any) => ({
          name: d.district,
          type: "district" as const,
          riskStatus: d.riskStatus,
          enrollment: d.totalEnrollment,
          attendanceRate: parseFloat(d.attendanceRate) / 100,
          reason: `${d.riskStatus} with ${d.totalSchools} schools at ${d.attendanceRate}% attendance`,
        }));
        setPriorityAreas(priorityData);
      })
      .catch((error) => {
        console.error("Error fetching school data:", error);
        setError("Failed to load school data. Check the browser console for details.");
      })
      .finally(() => setLoading(false));
  }, [selectedFilters]);

  const getRiskColor = (riskStatus: string) => {
    switch (riskStatus) {
      case "On Track":
        return "#22c55e";
      case "Behind":
        return "#eab308";
      case "At Risk":
        return "#f97316";
      case "Critical":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  // FIX: accepts undefined as well as null, since `deltas?.field` can be undefined
  const renderDelta = (delta: Delta | null | undefined) => {
    if (!delta) return null;
    const color =
      delta.direction === "up"
        ? "text-green-600"
        : delta.direction === "down"
        ? "text-red-600"
        : "text-gray-500";
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
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
          <div className="text-slate-600 mb-4">{error}</div>
          <div className="text-sm text-slate-500">
            Make sure you&apos;ve run: <code className="bg-slate-200 px-2 py-1 rounded">npm run db:seed</code>
          </div>
        </div>
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
              <h1 className="text-2xl font-bold text-slate-900">Program Dashboard</h1>
              <p className="text-slate-600 text-sm">School-level PBL performance tracking</p>
            </div>
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
              <select
                value={selectedFilters.month}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {filters.months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
              <select
                value={selectedFilters.district}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Districts</option>
                {filters.districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Block</label>
              <select
                value={selectedFilters.block}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, block: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Blocks</option>
                {filters.blocks.map((block) => (
                  <option key={block} value={block}>
                    {block}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <select
                value={selectedFilters.grade}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, grade: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                {filters.grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={selectedFilters.subject}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {filters.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Total Schools</div>
              <div className="text-2xl font-bold text-slate-900">{kpis.totalSchools}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Participation %</div>
              <div className="text-2xl font-bold text-slate-900">
                {(kpis.participationRate * 100).toFixed(1)}%
              </div>
              {renderDelta(deltas?.participationRate)}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Evidence %</div>
              <div className="text-2xl font-bold text-slate-900">
                {(kpis.evidenceSubmissionRate * 100).toFixed(1)}%
              </div>
              {renderDelta(deltas?.evidenceSubmissionRate)}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Total Enrollment</div>
              <div className="text-2xl font-bold text-slate-900">{kpis.totalEnrollment.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Total Attendance</div>
              <div className="text-2xl font-bold text-slate-900">{kpis.totalAttendance.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Attendance %</div>
              <div className="text-2xl font-bold text-slate-900">
                {(kpis.attendanceRate * 100).toFixed(1)}%
              </div>
              {renderDelta(deltas?.attendanceRate)}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Records</div>
              <div className="text-2xl font-bold text-slate-900">{schoolData.length}</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* District Performance Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">District Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="district" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendanceRate" name="Attendance Rate">
                    {districtPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskStatus)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Follow-Up Panel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Priority Follow-Up</h2>
            <div className="space-y-4">
              {priorityAreas.map((area, index) => (
                <div
                  key={index}
                  className="p-3 rounded-md border-l-4"
                  style={{ borderColor: getRiskColor(area.riskStatus) }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{area.name}</span>
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getRiskColor(area.riskStatus) }}
                    >
                      {area.riskStatus}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{area.reason}</p>
                </div>
              ))}
              {priorityAreas.length === 0 && (
                <div className="text-sm text-slate-500">No priority areas identified</div>
              )}
            </div>
          </div>
        </div>

        {/* District Performance Table */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">District Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">District</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Schools</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Enrollment</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Attendance</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Risk Status</th>
                </tr>
              </thead>
              <tbody>
                {districtPerformance.map((district, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-slate-900">{district.district}</td>
                    <td className="py-2 px-3 text-slate-600">{district.totalSchools}</td>
                    <td className="py-2 px-3 text-slate-600">{district.totalEnrollment.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-600">{district.attendanceRate}%</td>
                    <td className="py-2 px-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: getRiskColor(district.riskStatus) }}
                      >
                        {district.riskStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}