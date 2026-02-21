import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserProfile({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { farmerId, farmerName, profileImage, email, updateProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const openEditModal = () => {
    setEditName(displayName);
    setEditImage(profileImage);
    setShowEditModal(true);
    setOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfile(editName, editImage || undefined);
    setShowEditModal(false);
  };

  return (
    <div className="relative z-[100]" ref={ref}>
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
        <div className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 md:top-full md:mt-2 md:w-64 bottom-auto md:bottom-auto rounded-2xl glass-panel border border-gray-200 py-2 z-[100] shadow-xl md:shadow-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-bold text-gray-900 text-base">{displayName}</p>
            {email && <p className="text-sm text-gray-600 mt-0.5">{email}</p>}
            <p className="text-xs text-gray-500 mt-1">ID: {farmerId}</p>
          </div>
          <button
            onClick={openEditModal}
            className="w-full px-4 py-3 text-left text-gray-900 font-medium hover:bg-emerald-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </button>
          <button
            onClick={() => { onOpenSettings(); setOpen(false); }}
            className="w-full px-4 py-3 text-left text-gray-900 font-medium hover:bg-emerald-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Settings
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

      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-xl">Edit Profile</h3>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)} 
                className="p-2 rounded-full hover:bg-white/20 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {editImage ? (
                    <img
                      src={editImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-emerald-200">
                      {editName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86c.69 0 1.33.35 1.7.9l.82 1.2c.4.6 1.06.9 1.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-sm text-gray-600">Click camera icon to change photo</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  placeholder="Enter your name"
                />
              </div>

              {email && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 border border-gray-200">
                    {email}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:opacity-90 shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
