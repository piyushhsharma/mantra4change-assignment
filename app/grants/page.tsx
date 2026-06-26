"use client";

// Grant reporting page - shows grant facts, evidence gallery, and AI narrative generator
import { useEffect, useState } from "react";
import Link from "next/link";

interface GrantPerformance {
  id: string;
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: string;
  pblCompletionRate: number;
  evidenceSubmissionRate: number;
  attendanceRate: number;
  riskStatus: string;
  milestoneSummary: string | null;
}

interface GrantFinance {
  id: string;
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: string;
  budgetLine: string;
  approvedBudgetUnits: number;
  cumulativeUtilizedUnits: number;
  cumulativeUtilizationRate: number;
}

interface EvidenceMedia {
  id: string;
  grantId: string;
  donor: string;
  reportingMonth: string;
  district: string;
  title: string;
  summaryOrCaption: string;
  fileName: string;
  relativePath: string;
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<GrantPerformance[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  const [performance, setPerformance] = useState<GrantPerformance | null>(null);
  const [finance, setFinance] = useState<GrantFinance[]>([]);
  const [media, setMedia] = useState<EvidenceMedia[]>([]);

  const [aiEnabled, setAiEnabled] = useState(false);
  const [narrative, setNarrative] = useState<string>("");
  const [sourceFacts, setSourceFacts] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available grants and months
  useEffect(() => {
    fetch("/api/grants")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const uniqueGrants = Array.from(
          new Set(data.performance.map((g: GrantPerformance) => g.grantName))
        );
        const uniqueMonths = Array.from(
          new Set(data.performance.map((g: GrantPerformance) => g.reportingMonth))
        ).sort();

        setGrants(data.performance);
        setMonths(uniqueMonths);

        if (uniqueGrants.length > 0) setSelectedGrant(uniqueGrants[0]);
        if (uniqueMonths.length > 0) setSelectedMonth(uniqueMonths[uniqueMonths.length - 1]);
      })
      .catch((error) => {
        console.error("Error fetching grants:", error);
        setError("Failed to load grant data. Make sure the database is seeded.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch detailed data when grant/month changes
  useEffect(() => {
    if (!selectedGrant || !selectedMonth) return;

    const params = new URLSearchParams();
    params.append("grantId", selectedGrant);
    params.append("month", selectedMonth);

    fetch(`/api/grants?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPerformance(data.performance[0] || null);
        setFinance(data.finance);
        setMedia(data.media);
        setNarrative("");
        setSourceFacts(null);
      })
      .catch((error) => {
        console.error("Error fetching grant details:", error);
        setError("Failed to load grant details.");
      });
  }, [selectedGrant, selectedMonth]);

  const generateNarrative = async () => {
    if (!performance) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantName: performance.grantName,
          reportingMonth: performance.reportingMonth,
          pblCompletionRate: (performance.pblCompletionRate * 100).toFixed(1),
          evidenceSubmissionRate: (performance.evidenceSubmissionRate * 100).toFixed(1),
          attendanceRate: (performance.attendanceRate * 100).toFixed(1),
          riskStatus: performance.riskStatus,
          milestoneSummary: performance.milestoneSummary,
          aiEnabled,
        }),
      });

      const data = await response.json();
      setNarrative(data.narrative);
      setSourceFacts(data.sourceFacts);
    } catch (error) {
      console.error("Error generating narrative:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyNarrative = () => {
    if (narrative) {
      navigator.clipboard.writeText(narrative);
      alert("Narrative copied to clipboard!");
    }
  };

  const getRiskColor = (riskStatus: string) => {
    switch (riskStatus) {
      case "On Track": return "bg-green-100 text-green-800";
      case "Behind": return "bg-yellow-100 text-yellow-800";
      case "At Risk": return "bg-orange-100 text-orange-800";
      case "Critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading grant data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Grant Data</div>
          <div className="text-slate-600 mb-4">{error}</div>
          <div className="text-sm text-slate-500">
            Make sure you've run: <code className="bg-slate-200 px-2 py-1 rounded">npm run db:seed</code>
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
              <h1 className="text-2xl font-bold text-slate-900">Grant Reporting Assistant</h1>
              <p className="text-slate-600 text-sm">Generate grant reports with AI-powered narratives</p>
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
        {/* Grant and Month Selector */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grant</label>
              <select
                value={selectedGrant}
                onChange={(e) => setSelectedGrant(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {grants.map((grant) => (
                  <option key={grant.id} value={grant.grantName}>
                    {grant.grantName} ({grant.donor})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {performance && (
          <>
            {/* Fact Panel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Facts</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">PBL Completion Rate</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(performance.pblCompletionRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Evidence Submission Rate</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(performance.evidenceSubmissionRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Attendance Rate</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(performance.attendanceRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-slate-600 mb-1">Risk Status</div>
                  <div className="text-2xl font-bold">
                    <span className={`px-3 py-1 rounded-full text-sm ${getRiskColor(performance.riskStatus)}`}>
                      {performance.riskStatus}
                    </span>
                  </div>
                </div>
              </div>

              {performance.milestoneSummary && (
                <div className="mt-4 p-4 bg-slate-50 rounded-md">
                  <div className="text-sm font-medium text-slate-700 mb-1">Milestone Summary</div>
                  <div className="text-sm text-slate-600">{performance.milestoneSummary}</div>
                </div>
              )}

              {/* Finance Utilization */}
              {finance.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Finance Utilization</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-medium text-slate-700">Budget Line</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-700">Approved</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-700">Utilized</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-700">Utilization Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finance.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-2 px-3 text-slate-900">{item.budgetLine}</td>
                            <td className="py-2 px-3 text-slate-600">{item.approvedBudgetUnits.toLocaleString()}</td>
                            <td className="py-2 px-3 text-slate-600">{item.cumulativeUtilizedUnits.toLocaleString()}</td>
                            <td className="py-2 px-3 text-slate-600">{(item.cumulativeUtilizationRate * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Gallery */}
            {media.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Evidence Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-md overflow-hidden">
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        <img
                          src={item.relativePath}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden text-slate-400 text-sm">Image not found</div>
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium text-slate-900 truncate">{item.title}</div>
                        <div className="text-xs text-slate-500 truncate">{item.summaryOrCaption}</div>
                        <div className="text-xs text-slate-400 mt-1">{item.district}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Narrative Generator */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">AI Narrative Generator</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">AI:</span>
                  <button
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      aiEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={generateNarrative}
                disabled={generating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>

              {narrative && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-700">Generated Narrative</h3>
                    <button
                      onClick={copyNarrative}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Copy text
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-slate-900">{narrative}</p>
                  </div>

                  {sourceFacts && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-slate-600 mb-2">Sources Used:</h4>
                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(sourceFacts, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
