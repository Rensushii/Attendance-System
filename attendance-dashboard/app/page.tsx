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

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRegistrations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-4">📋 Event Attendance Dashboard by RenTech</h1>
      <p className="text-lg mb-6">Total registered: {registrations.length}</p>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">#</th>
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Email</th>
            <th className="border border-gray-300 p-2">MAC Address</th>
            <th className="border border-gray-300 p-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
          ) : registrations.length === 0 ? (
            <tr><td colSpan={5} className="p-4 text-center">No registrations yet.</td></tr>
          ) : (
            registrations.map((reg, idx) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-300 p-2">{reg.name}</td>
                <td className="border border-gray-300 p-2">{reg.email}</td>
                <td className="border border-gray-300 p-2">{reg.mac}</td>
                <td className="border border-gray-300 p-2">{new Date(reg.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Download button */}
      <div className="mt-6 text-center">
        <a
          href="/attendance-laptop.zip"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
           Download ESP32 System
        </a>
      </div>
    </main>
  );
}