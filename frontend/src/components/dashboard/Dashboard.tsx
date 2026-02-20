import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, Crop } from "../../api/client";
import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import MobileBottomNav from "./MobileBottomNav";
import AddCropModal from "./AddCropModal";
import UserProfile from "./UserProfile";
import SettingsModal from "./SettingsModal";

export default function Dashboard() {
  const [mobileTab, setMobileTab] = useState<"chat" | "plan">("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { token, logout } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCrops = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const list = await api.crops.list(token);
      setCrops(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      if (list.length === 0) setSelectedId(null);
    } catch (e) {
      console.error(e);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [token]);

  const onCropAdded = (crop: Crop) => {
    setCrops((prev) => [crop, ...prev]);
    setSelectedId(crop.id);
    setAddModalOpen(false);
  };

  const onCropDeleted = (id: number) => {
    setCrops((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(crops[0]?.id ?? null);
  };

  const selectedCrop = crops.find((c) => c.id === selectedId);

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      <div className="relative z-10 flex flex-1 flex-col lg:flex-row min-w-0 min-h-0 overflow-hidden">
      <LeftPanel
        crops={crops}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={() => setAddModalOpen(true)}
        onDeleted={onCropDeleted}
        onOpenSettings={() => setSettingsOpen(true)}
        loading={loading}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-20 lg:pb-0">
        <header className="flex-shrink-0 flex items-center justify-end px-4 py-3 lg:px-6 border-b border-gray-200 glass-panel-light">
          <UserProfile onOpenSettings={() => setSettingsOpen(true)} />
        </header>
        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          <div className={`flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden ${mobileTab === "plan" ? "hidden lg:flex" : "flex"}`}>
            <CenterPanel fieldId={selectedId} cropName={selectedCrop?.crop_name ?? ""} fieldName={selectedCrop?.name} />
          </div>
          <div className={`flex-1 min-h-0 min-w-0 lg:max-w-[360px] overflow-hidden ${mobileTab === "chat" ? "hidden lg:flex" : "flex"}`}>
            <RightPanel fieldId={selectedId} crop={selectedCrop} />
          </div>
        </div>
      </div>
      <MobileBottomNav active={mobileTab} onSelect={setMobileTab} />
      {addModalOpen && (
        <AddCropModal
          token={token!}
          onClose={() => setAddModalOpen(false)}
          onSuccess={onCropAdded}
        />
      )}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onLogout={logout} />
      )}
      </div>
    </div>
  );
}
