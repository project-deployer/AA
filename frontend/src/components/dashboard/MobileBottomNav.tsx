interface Props {
  active: "chat" | "plan";
  onSelect: (tab: "chat" | "plan") => void;
}

export default function MobileBottomNav({ active, onSelect }: Props) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass-panel-light border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around py-3 px-2">
        <button
          onClick={() => onSelect("chat")}
          className={`flex flex-col items-center gap-1 px-8 py-3 rounded-2xl min-h-[56px] min-w-[80px] justify-center transition-all duration-200 ${
            active === "chat" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-bold">Chat</span>
        </button>
        <button
          onClick={() => onSelect("plan")}
          className={`flex flex-col items-center gap-1 px-8 py-3 rounded-2xl min-h-[56px] min-w-[80px] justify-center transition-all duration-200 ${
            active === "plan" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-bold">Plan</span>
        </button>
      </div>
    </nav>
  );
}
