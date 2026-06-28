"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Registration {
  id: number;
  name: string;
  email: string;
  mac: string;
  created_at: string;
}

export default function Dashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "email">("name");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setRegistrations(data);
      setLastFetched(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered data based on search and time range
  const filteredData = useMemo(() => {
    let result = registrations;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((reg) => {
        const field = searchType === "name" ? reg.name : reg.email;
        return field.toLowerCase().includes(query);
      });
    }

    // Time filter
    if (startTime || endTime) {
      result = result.filter((reg) => {
        const regDate = new Date(reg.created_at).getTime();
        if (startTime && regDate < new Date(startTime).getTime()) return false;
        if (endTime && regDate > new Date(endTime).getTime()) return false;
        return true;
      });
    }

    return result;
  }, [registrations, searchQuery, searchType, startTime, endTime]);

  // Today count (from full data)
  const todayCount = useMemo(() => {
    const today = new Date();
    return registrations.filter((r) => {
      const regDate = new Date(r.created_at);
      return (
        regDate.getDate() === today.getDate() &&
        regDate.getMonth() === today.getMonth() &&
        regDate.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [registrations]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📋 <span>Attendance Dashboard</span>
              <span className="text-sm font-normal text-gray-500 ml-2">
                by RenTech
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Real-time event check‑in monitoring
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              ← Home
            </a>
            {lastFetched && (
              <span className="text-xs text-gray-500">
                Last updated: {lastFetched.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats (based on all data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <p className="text-sm font-medium text-gray-400">
              Total Registrations
            </p>
            <p className="text-3xl font-bold text-white mt-1">
              {loading ? "—" : registrations.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <p className="text-sm font-medium text-gray-400">Today</p>
            <p className="text-3xl font-bold text-white mt-1">
              {loading ? "—" : todayCount}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
            <p className="text-sm font-medium text-gray-400">
              Unique Devices
            </p>
            <p className="text-3xl font-bold text-white mt-1">
              {loading
                ? "—"
                : new Set(registrations.map((r) => r.mac)).size}
            </p>
          </div>
        </div>

        {/* Search and filter bar */}
        <div className="mb-6 bg-gray-800 rounded-xl border border-gray-700/50 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            🔍 Search & Filter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search type dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Search by
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "name" | "email")}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Search input */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                {searchType === "name" ? "Name" : "Email"}
              </label>
              <input
                type="text"
                placeholder={searchType === "name" ? "e.g. John" : "e.g. john@example.com"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Start time */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* End time */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Show active filter count */}
          {(searchQuery || startTime || endTime) && (
            <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
              <span>🔹 Showing {filteredData.length} of {registrations.length} registrations</span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStartTime("");
                  setEndTime("");
                }}
                className="text-indigo-400 hover:text-indigo-300 underline text-xs"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Registered Attendees
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {filteredData.length === registrations.length
                ? "Full list of checked‑in participants"
                : `Filtered list (${filteredData.length} results)`}
            </p>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-gray-700 rounded w-8"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">
                {registrations.length === 0 ? "📭" : "🔍"}
              </div>
              <h3 className="text-lg font-medium text-white">
                {registrations.length === 0
                  ? "No registrations yet"
                  : "No matching records"}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {registrations.length === 0
                  ? "Once someone checks in, their details will appear here."
                  : "Try adjusting your search or time filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      MAC Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredData.map((reg, idx) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {reg.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {reg.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                        {reg.mac}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(reg.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Download card */}
        <div className="mt-10 bg-gray-800 rounded-xl border border-gray-700/50 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              💻 Ready to deploy the offline check‑in system?
            </h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              Download the one‑click installer for Windows. It automatically
              detects the ESP32, runs silently in the background, and syncs all
              data to this dashboard.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6">
            <a
              href="/attendance-laptop.zip"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download ESP32 System
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}