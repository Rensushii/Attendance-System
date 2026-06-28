"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📋 <span>Attendance Dashboard</span>
              <span className="text-sm font-normal text-gray-500 ml-2">by RenTech</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Real-time event check‑in monitoring</p>
          </div>
          {lastFetched && (
            <span className="text-xs text-gray-400 mt-2 sm:mt-0">
              Last updated: {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Total Registrations</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? "—" : registrations.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading
                ? "—"
                : registrations.filter((r) => {
                    const today = new Date();
                    const regDate = new Date(r.created_at);
                    return (
                      regDate.getDate() === today.getDate() &&
                      regDate.getMonth() === today.getMonth() &&
                      regDate.getFullYear() === today.getFullYear()
                    );
                  }).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Unique Devices</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? "—" : new Set(registrations.map((r) => r.mac)).size}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Registered Attendees</h2>
            <p className="text-sm text-gray-500 mt-1">Full list of checked‑in participants</p>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900">No registrations yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Once someone checks in, their details will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MAC Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {registrations.map((reg, idx) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {reg.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {reg.mac}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
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
        <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">💻 Ready to deploy the offline check‑in system?</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Download the one‑click installer for Windows. It automatically detects the ESP32, runs silently in the background, and syncs all data to this dashboard.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6">
            <a
              href="/attendance-laptop.zip"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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