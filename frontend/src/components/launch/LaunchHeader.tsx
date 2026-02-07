interface Props {
  onLoginClick?: () => void;
  onBackClick?: () => void;
  page?: "overview" | "login";
}

export default function LaunchHeader({ onLoginClick, onBackClick, page = "overview" }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 safe-area-top">
      <span className="font-display font-extrabold text-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
        AgriAI
      </span>
      {page === "overview" && (
        <button
          onClick={onLoginClick}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-300 text-emerald-700 hover:from-emerald-200 hover:to-green-200 hover:border-emerald-400 transition-all"
        >
          Login
        </button>
      )}
      {page === "login" && onBackClick && (
        <button
          onClick={onBackClick}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-300 text-emerald-700 hover:from-emerald-200 hover:to-green-200 hover:border-emerald-400 transition-all flex items-center gap-1"
        >
          ← Back
        </button>
      )}
    </header>
  );
}
