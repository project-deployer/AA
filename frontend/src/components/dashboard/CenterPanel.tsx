import { useState } from "react";
import ChatMessages from "./chat/ChatMessages";
import ChatInput from "./chat/ChatInput";
import { getCropImageUrl } from "../../utils/cropImages";

interface Props {
  fieldId: number | null;
  cropName: string;
  fieldName?: string;
}

export default function CenterPanel({ fieldId, cropName, fieldName }: Props) {
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const handleChatSent = () => {
    setChatRefreshKey((k) => k + 1);
    // ChatMessages handles auto-scrolling itself
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 glass-panel-light border-r border-gray-200">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {fieldId ? (
          <>
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 glass-panel-light flex items-center gap-4">
              <img
                src={getCropImageUrl(cropName)}
                alt={cropName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-green-200"
              />
              <div>
                <h2 className="font-display font-bold text-lg text-gray-900">{fieldName || "My Field"}</h2>
                <p className="text-gray-600 text-sm">Ask anything about your {cropName || "crop"}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <ChatMessages fieldId={fieldId} refreshKey={chatRefreshKey} />
            </div>
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white/80 safe-area-bottom">
              <ChatInput fieldId={fieldId} onSent={handleChatSent} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <div className="text-7xl mb-6 animate-pulse">🌾</div>
            <p className="font-display font-bold text-gray-900 text-lg">Select a crop</p>
            <p className="text-sm mt-2">Or add a new one from the menu</p>
          </div>
        )}
      </div>
    </main>
  );
}
