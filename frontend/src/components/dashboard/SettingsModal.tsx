import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

interface Props {
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsModal({ onClose, onLogout }: Props) {
  const { farmerName, profileImage, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      // Convert image to base64 for local storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateProfile(farmerName || "Farmer", base64);
        setUploading(false);
      };
      reader.onerror = () => {
        setUploadError("Failed to read image");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError("Failed to upload image");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border-gray-200 animate-scale-up">
        <div className="sticky top-0 glass-panel-light rounded-t-3xl border-b border-gray-200 px-6 py-5 flex items-center justify-between z-10">
          <h2 className="font-display font-extrabold text-xl text-gray-900">Profile & Settings</h2>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-gray-100 min-w-[44px] min-h-[44px] transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Profile Section */}
          <div className="rounded-2xl glass-card border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Your Profile</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={farmerName || "Profile"}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-green-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-green-200">
                    {(farmerName || "F").charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-2.5 shadow-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="w-full text-center">
                <p className="text-sm text-gray-600 mb-2">Farmer Name</p>
                <p className="font-bold text-gray-900 text-lg">{farmerName || "Your Name"}</p>
              </div>

              {uploadError && (
                <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                </div>
              )}

              {uploading && (
                <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Uploading image...</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl glass-card border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">App Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 px-4 rounded-xl glass-panel-light border-gray-200 border">
                <span className="font-medium text-gray-700">Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl glass-panel-light border-gray-200 border">
                <span className="font-medium text-gray-700">Crop reminders</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass-card border-gray-200 p-4 mt-4">
            <h3 className="font-bold text-gray-900 mb-3">About</h3>
            <div className="py-3 px-4 rounded-xl glass-panel-light border-gray-200 border">
              <p className="font-semibold text-gray-900">AgriAI</p>
              <p className="text-sm text-gray-600 mt-1">Smart Agriculture Assistant v1.0</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full py-4 rounded-2xl font-bold text-red-700 glass-card border border-red-300 bg-gradient-to-r from-red-100 to-red-50 hover:border-red-400 hover:bg-red-100 flex items-center justify-center gap-2 min-h-[48px] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
