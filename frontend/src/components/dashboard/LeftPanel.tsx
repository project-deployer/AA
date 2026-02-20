import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, Crop } from "../../api/client";
import { getCropImageUrl, getCropEmoji } from "../../utils/cropImages";

interface Props {
  crops: Crop[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onDeleted: (id: number) => void;
  onOpenSettings?: () => void;
  loading: boolean;
}

interface CropCardState {
  [key: number]: boolean; // imageLoaded state per crop
}

export default function LeftPanel({ crops, selectedId, onSelect, onAdd, onDeleted, onOpenSettings, loading }: Props) {
  const { token } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState<CropCardState>({})

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Remove this crop?")) return;
    if (!token) return;
    setDeletingId(id);
    try {
      await api.crops.delete(token, id);
      onDeleted(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-20 p-3 rounded-2xl glass-panel shadow-md min-w-[44px] min-h-[44px] hover:border-gray-300 transition-all"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30 w-80 lg:w-[300px] flex flex-col
          glass-panel border-r border-gray-200
          transform transition-transform duration-300 ease-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              AgriAI
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <button
            onClick={() => { onAdd(); setDrawerOpen(false); }}
            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md flex items-center justify-center gap-2 mb-5 min-h-[48px] border border-green-300 hover:shadow-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Crop / Field
          </button>

          {loading ? (
            <div className="text-center py-12 text-gray-600 font-medium">Loading...</div>
          ) : crops.length === 0 ? (
            <div className="rounded-2xl glass-card p-6 text-center border-gray-200">
              <p className="text-gray-900 font-medium">No crops yet.</p>
              <p className="text-gray-600 text-sm mt-1">Tap Add Crop to start.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {crops.map((c) => (
                <li key={c.id}>
                  <div
                    onClick={() => { onSelect(c.id); setDrawerOpen(false); }}
                    className={`
                      flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer min-h-[64px]
                      transition-all duration-200 border
                      ${selectedId === c.id
                        ? "glass-panel border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
                        : "glass-card border-gray-200 hover:border-gray-300"}
                    `}
                  >
                    {imageLoaded[c.id] ? (
                      <img
                        src={getCropImageUrl(c.crop_name)}
                        alt={c.crop_name}
                        onLoad={() => setImageLoaded((s) => ({ ...s, [c.id]: true }))}
                        onError={() => setImageLoaded((s) => ({ ...s, [c.id]: false }))}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-green-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 ring-2 ring-green-200 bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                        <span className="text-lg">{getCropEmoji(c.crop_name)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">{c.name || c.crop_name}</p>
                      <p className="text-xs text-gray-600 truncate">{c.crop_name} · {c.land_area_acres} acre</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, c.id)}
                      disabled={deletingId === c.id}
                      className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 min-w-[44px] min-h-[44px] transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => { onOpenSettings?.(); setDrawerOpen(false); }}
            className="w-full py-3 rounded-2xl text-gray-700 font-semibold hover:bg-gray-100 flex items-center gap-2 px-4 min-h-[48px] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Settings
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
