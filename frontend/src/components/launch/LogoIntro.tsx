export default function LogoIntro() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      <div className="relative z-10 flex flex-col items-center gap-6 animate-logo-intro">
        <div className="relative">
          {/* Glass logo card */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-2xl scale-150 animate-pulse" />
            <div className="relative w-36 h-36 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center ring-2 ring-green-200 animate-logo-float border border-green-300">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-100 to-green-100" />
              <img src="/agriai-logo-updated.svg" alt="AgriAI" className="w-28 h-28 drop-shadow relative z-10" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display font-extrabold text-5xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
            AgriAI
          </h1>
          <p className="text-gray-700 text-base font-semibold mt-2 tracking-wide">
            Smart Agriculture Assistant
          </p>
        </div>
      </div>
    </div>
  );
}
