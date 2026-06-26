// Landing page - just links to the main features
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            PBL Program Intelligence & Grant Reporting Assistant
          </h1>
          <p className="text-xl text-slate-600 mb-12">
            Transform raw school survey data into review-ready decisions and grant-ready reports
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Link
              href="/dashboard"
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Program Dashboard
              </h2>
              <p className="text-slate-600">
                View school-level PBL data, track participation rates, monitor attendance,
                and identify priority districts needing attention
              </p>
            </Link>

            <Link
              href="/grants"
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="text-4xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Grant Reporting Assistant
              </h2>
              <p className="text-slate-600">
                Generate grant reports with AI-powered narratives, view evidence galleries,
                and track performance metrics
              </p>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Links
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/grants"
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Grant Reports
              </Link>
              <Link
                href="/summary"
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Monthly Summary
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
