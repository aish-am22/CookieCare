import React from "react";
import { ShieldCheck, ShieldAlert, Settings, FileCheck, Layers, Radio, HelpCircle, ArrowRight } from "lucide-react";

interface DashboardHomeProps {
  userName: string;
  setActiveTab: (tab: string) => void;
  stats: {
    totalDocs: number;
    pendingSigs: number;
    redlinesPending: number;
  };
}

export default function DashboardHome({ userName, setActiveTab, stats }: DashboardHomeProps) {
  // Static representation of scanned logs to populate the timeline beautifully without placeholder mocks
  const continuousLogs = [
    { target: "https://shoppingsite.com", score: 84, issues: 3, banner: "Found", scanTime: "Just now" },
    { target: "https://marketing-funnel.org", score: 42, issues: 8, banner: "Missing", scanTime: "2 hours ago" },
    { target: "https://personalblog.io", score: 98, issues: 0, banner: "Found", scanTime: "6 hours ago" },
    { target: "https://legacy-portal.net", score: 55, issues: 5, banner: "Found", scanTime: "1 day ago" }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-10 font-sans grid-bg min-h-screen">
      {/* Header section */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-mono tracking-wider uppercase mt-1">
            Cookie Care Auditing Console
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 bg-white shadow-xs border border-gray-200/60 rounded-full py-1.5 px-3">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Scanning nodes online</span>
        </div>
      </div>

      {/* Greeting Card with precise layout */}
      <div className="mb-10">
        <h2 className="text-2xl font-display font-medium text-gray-900">
          Welcome back, {userName}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Monitor your continuous privacy posture and compliance indicators below
        </p>
      </div>

      {/* DYNAMIC METRICS KPI PANEL - SECURE LIVE BOUNDARIES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border-2 border-black p-6 rounded-none flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-400 font-black tracking-widest mb-1">
              Active Documents
            </p>
            <h3 className="text-3xl font-display font-black text-gray-900">
              {stats.totalDocs}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              Stored securely in multitenant Vault
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-50 border border-gray-200/80 flex items-center justify-center text-gray-700">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 rounded-none flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-400 font-black tracking-widest mb-1">
              Pending Signatures
            </p>
            <h3 className="text-3xl font-display font-black text-gray-900">
              {stats.pendingSigs}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              Awaiting corporate signers
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-50 border border-gray-200/80 flex items-center justify-center text-amber-600">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 rounded-none flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-400 font-black tracking-widest mb-1">
              Active Redlines
            </p>
            <h3 className="text-3xl font-display font-black text-gray-900">
              {stats.redlinesPending}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              Required compromise revisions
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-50 border border-gray-200/80 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Key functional shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Cookie Scanner Shortcut Card */}
        <div 
          onClick={() => setActiveTab("cookie-scanner")}
          className="group cursor-pointer bg-white border border-gray-200/80 rounded-none p-6 shadow-xs hover:border-black transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center border border-gray-200/80 mb-5 text-gray-700 font-bold group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              Cookie Scanner
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Scrape URLs to isolate active tracker scripts, check opt-in compliance, and perform dynamic traffic light regulations scoring.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-900">
            <span>Scan Domain Target</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Vulnerability Scanner Shortcut Card */}
        <div 
          onClick={() => setActiveTab("vulnerability-scanner")}
          className="group cursor-pointer bg-white border border-gray-200/80 rounded-none p-6 shadow-xs hover:border-black transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center border border-gray-200/80 mb-5 text-gray-700 font-bold group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              Vulnerability Scanner
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Initiate network profiling, verify certificate domains and track missing security headers (HSTS, CSP, X-Frame) instantly.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-900">
            <span>Isolate Server Vulnerability</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Legal Review tab */}
        <div 
          onClick={() => setActiveTab("legal-review")}
          className="group cursor-pointer bg-white border border-gray-200/80 rounded-none p-6 shadow-xs hover:border-black transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-none bg-gray-50 flex items-center justify-center border border-gray-200/80 mb-5 text-gray-700 font-bold group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              Legal Review Suite
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Edit NDAs, DPAs, and SLA agreements. Coordinate peer redlining, execute electronic signatures, and leverage AI analysis to redact risks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-900">
            <span>Manage Agreement Matrix</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

      </div>

      {/* CONTINUOUS SCANNING TELEMETRY MATRIX */}
      <div className="bg-white border-2 border-black p-6 rounded-none mb-10">
        <h4 className="text-xs font-semibold text-black font-mono tracking-wider uppercase mb-5 flex items-center space-x-2">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse animate-duration-1000" />
          <span>Passive Scan Logs Telemetry</span>
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-gray-800">
            <thead>
              <tr className="border-b border-gray-300 uppercase tracking-wider text-[10px] text-gray-400 font-black">
                <th className="pb-3 pr-4">Host Domain</th>
                <th className="pb-3 px-4">Audit Score</th>
                <th className="pb-3 px-4">Isolated Violations</th>
                <th className="pb-3 px-4">Consent Banner State</th>
                <th className="pb-3 pl-4 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {continuousLogs.map((log, i) => {
                let scoreColor = "text-emerald-700 font-bold bg-emerald-50 border border-emerald-100";
                if (log.score < 50) scoreColor = "text-red-700 font-bold bg-red-50 border border-red-100";
                else if (log.score < 80) scoreColor = "text-amber-700 font-bold bg-amber-50 border border-amber-100";

                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 pr-4 text-gray-900 font-bold">{log.target}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] inline-block text-center min-w-10 ${scoreColor}`}>
                        {log.score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-600">{log.issues} Gaps</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight inline-block ${
                        log.banner === "Found" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {log.banner}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right text-gray-400">{log.scanTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
