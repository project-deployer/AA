import LaunchHeader from "./LaunchHeader";

const FEATURES = [
  {
    icon: "🌱",
    title: "Crop Planning",
    desc: "Plan scientifically. Choose the right crop with data-driven insights.",
  },
  {
    icon: "📅",
    title: "Day-to-Day Guide",
    desc: "Daily tasks – irrigation, fertilizers, weeding. Clear guidance.",
  },
  {
    icon: "💬",
    title: "AI Support",
    desc: "Ask any question. Get crop help anytime with our smart assistant.",
  },
  {
    icon: "📈",
    title: "Market Insights",
    desc: "Crop prices and demand signals to pick profitable seasons.",
  },
  {
    icon: "🧪",
    title: "Soil & Fertility",
    desc: "Recommendations based on soil type and past yields.",
  },
];

export default function FeatureOverview({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      <LaunchHeader onLoginClick={onNext} />

      <div className="flex-1 flex flex-col px-5 pt-16 pb-8 relative z-10">
        <h2 className="font-display font-extrabold text-2xl text-gray-900 text-center mb-1">
          What AgriAI offers
        </h2>
        <p className="text-gray-600 text-sm text-center mb-10">
          Your smart farming companion
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="rounded-xl glass-card border-green-200 flex flex-col items-center justify-center p-3 hover:shadow-lg hover:border-green-300 hover:scale-105 transition-all duration-300"
            >
              <div className="text-3xl mb-1">{f.icon}</div>
              <h3 className="font-display font-bold text-gray-900 text-center text-xs">{f.title}</h3>
              <p className="text-gray-600 text-xs text-center mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-8 p-4 rounded-2xl glass-card border-gray-200">
          <h3 className="font-display font-bold text-gray-900 text-lg mb-2">How it works</h3>
          <p className="text-sm text-gray-700">
            AgriAI combines weather, soil data, and local market signals to generate
            a simple daily plan for your crop. You get step-by-step tasks, cost
            estimates, and fertilizer & irrigation recommendations tailored to your field.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <div className="text-2xl">🛰️</div>
              <p className="text-xs text-gray-600 mt-1">Local Weather</p>
            </div>
            <div className="text-center">
              <div className="text-2xl">🧭</div>
              <p className="text-xs text-gray-600 mt-1">Crop Guidance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl">💹</div>
              <p className="text-xs text-gray-600 mt-1">Market Signals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 safe-area-bottom relative z-10">
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] transition-all border border-green-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
