import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserProfile({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { farmerId, farmerName, profileImage, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const displayName = farmerName || "Farmer";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative z-40" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 p-2 pr-3 rounded-2xl hover:bg-gray-100 transition-colors min-h-[44px] text-gray-900"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-green-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-green-200">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
          <p className="text-xs text-gray-600">ID: {farmerId}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 md:top-full md:mt-2 md:w-56 bottom-auto md:bottom-auto rounded-2xl glass-panel border border-gray-200 py-2 z-50 shadow-xl md:shadow-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-600">Farmer ID: {farmerId}</p>
          </div>
          <button
            onClick={() => { onOpenSettings(); setOpen(false); }}
            className="w-full px-4 py-3 text-left text-gray-900 font-medium hover:bg-emerald-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Profile & Settings
          </button>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full px-4 py-3 text-left text-red-600 font-medium hover:bg-red-50 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
