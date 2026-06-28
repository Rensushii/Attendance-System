export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <span className="text-xl font-bold text-white">
              GenbaCheck Attendance
              <span className="hidden sm:inline text-sm font-normal text-gray-400 ml-2">
                (demo, will add admin login later)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm font-medium text-gray-400 hover:text-white transition"
            >
              Live Dashboard
            </a>
            <a
              href="/attendance-laptop.zip"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
            >
              Download System
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800 mb-6">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Offline-first technology
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Check‑in that{" "}
                <span className="text-indigo-400">just works</span>
              </h1>
              <p className="mt-6 text-lg text-gray-400 max-w-xl">
                Eliminate long lines, paper forms, and fake attendance. Our
                system uses a private Wi‑Fi QR code and captive portal to verify
                physical presence — no link sharing, no internet required.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/20"
                >
                  View Live Dashboard →
                </a>
                <a
                  href="/attendance-laptop.zip"
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition"
                >
                  Download for Windows
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <img
                  src="/images/esp32.jpg"
                  alt="ESP32 with OLED display showing QR code"
                  className="w-full h-auto object-cover rounded-2xl border border-gray-700 shadow-lg"
                />
                <div className="absolute -bottom-4 -right-4 bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-700">
                  <p className="text-sm font-semibold text-white">
                    ESP32 + OLED
                  </p>
                  <p className="text-xs text-gray-400">QR code check‑in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Why current methods fail
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Traditional attendance systems suffer from two common problems
              that we&apos;ve completely eliminated.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-red-900/20 rounded-xl border border-red-800/40">
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                ❌ Long registration lines
              </h3>
              <p className="text-red-200/70 text-sm">
                Paper forms and manual entry create bottlenecks. Even online
                forms require an internet connection and often crash under load.
              </p>
            </div>
            <div className="p-6 bg-red-900/20 rounded-xl border border-red-800/40">
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                🔗 Link sharing / fake attendance
              </h3>
              <p className="text-red-200/70 text-sm">
                When registration links are sent online, students share them
                with friends who aren&apos;t in the room. There&apos;s no way
                to prove physical presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              A seamless experience from arrival to cloud sync — completely
              offline for the attendee.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Scan QR", desc: "Attendee scans the Wi‑Fi QR displayed on the OLED screen using their phone camera. No app needed." },
              { step: "02", title: "Auto‑connect", desc: "Phone joins the ESP32’s private Wi‑Fi. A captive portal automatically opens the registration page." },
              { step: "03", title: "Register", desc: "Attendee enters name & email. The ESP32 captures MAC address to prevent duplicate check‑ins." },
              { step: "04", title: "Instant disconnect", desc: "After successful registration, the device is kicked off the Wi‑Fi, freeing the slot for the next person." },
            ].map((item) => (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center p-6 bg-gray-800 rounded-2xl shadow-sm border border-gray-700/50"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-900/50 text-indigo-300 flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Why it&apos;s unique
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Designed to solve the real pain points of event organizers and
              educators.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "📴", title: "100% Offline Registration", desc: "No internet access means the registration URL can't be shared outside the room. Physical presence is required." },
              { icon: "🔒", title: "Automatic MAC Blacklist", desc: "Once a device registers, its MAC is stored. The same phone can't re‑register, preventing buddy punching." },
              { icon: "☁️", title: "Cloud Sync & Dashboard", desc: "All data is instantly sent to a secure online dashboard, accessible from anywhere via Vercel." },
              { icon: "⚡", title: "Plug & Play Setup", desc: "Pre‑flashed ESP32 and a single‑click installer for the laptop. No technical knowledge needed." },
              { icon: "📱", title: "No App Installation", desc: "Attendees only need a phone camera. The captive portal works on any modern smartphone." },
              { icon: "🔄", title: "Live Updates", desc: "The dashboard refreshes every 10 seconds, so you always see the latest check‑ins." },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-gray-800 rounded-xl hover:shadow-md hover:shadow-gray-900/50 transition-shadow duration-200 border border-gray-700/50"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 text-gray-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Lorence Ojales. Built with Next.js, Supabase
            & ESP32.
          </p>
        </div>
      </footer>
    </div>
  );
}