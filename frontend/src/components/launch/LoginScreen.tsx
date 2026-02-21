import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { isFirebaseConfigured } from "../../config/firebase";
import LaunchHeader from "./LaunchHeader";
import { initFirebase, getIdToken, signInWithGoogle } from "../../utils/firebaseClient";

export default function LoginScreen({ onBack }: { onBack?: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [farmerName, setFarmerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleDevLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.verify("dev_" + Date.now());
      setAuth("dev_" + Date.now(), res.farmer_id);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network")) {
        setError("Backend not running. Use Enter Dashboard to explore.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineEntry = () => {
    setAuth("dev_offline_" + Date.now(), 1);
    navigate("/dashboard", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Starting Google sign-in...");
      initFirebase();
      console.log("Firebase initialized, calling signInWithGoogle...");
      const cred = await signInWithGoogle();
      console.log("Google sign-in successful, user:", cred.user.email);
      const user = cred.user;
      const idToken = await getIdToken(user);
      console.log("ID token obtained");
      const res = await api.auth.verify(idToken, {
        phone: user.phoneNumber || undefined,
        email: user.email || undefined,
        display_name: user.displayName || undefined,
      });
      console.log("Backend verification successful");
      setAuth(idToken, res.farmer_id, res.display_name || user.displayName || "Farmer", undefined, res.email || user.email || undefined, res.phone || user.phoneNumber || undefined);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error("Google sign-in error:", err);
      console.error("Error code:", err?.code);
      console.error("Full error:", JSON.stringify(err));
      setError(errMsg || "Google sign-in failed. Check browser console for details.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFarmerName("");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50">
      <LaunchHeader page="login" onBackClick={onBack} />

      <div className="flex-1 flex flex-col px-5 pt-16 pb-8 relative z-10 max-w-md mx-auto w-full">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="font-display font-extrabold text-2xl text-gray-900">
            {isSignUp ? "Create Account" : "Sign in"}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {isSignUp ? "Join AgriAI and manage your crops" : "Connect to your AgriAI account"}
          </p>
        </div>

        <form className="flex flex-col gap-4 animate-slide-in-down">
          <div className="space-y-4 animate-fade-in">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Farmer name</label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="Your full name"
                  className="glass-input"
                  maxLength={50}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {isFirebaseConfigured && (
            <p className="text-xs text-gray-600 text-center">OTP login is removed in v2.0. Use Google sign-in.</p>
          )}
        </form>

        {!isFirebaseConfigured && (
          <div className="mt-4 space-y-3 animate-slide-in-down">
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md border border-green-300 disabled:opacity-60 hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {loading ? "..." : "Continue (Dev)"}
            </button>
            <button
              onClick={handleOfflineEntry}
              type="button"
              className="w-full py-2 rounded-xl text-xs font-medium border border-dashed border-emerald-400 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-all"
            >
              Enter Dashboard (offline)
            </button>
          </div>
        )}

        <div className="mt-6 animate-slide-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={!isFirebaseConfigured || loading}
            className="w-full py-3 rounded-xl text-sm font-medium border border-gray-300 bg-white flex items-center justify-center gap-2 text-gray-900 disabled:opacity-50 hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isSignUp ? "Sign up with Google" : "Continue with Google"}
          </button>
          <p className="text-center text-gray-500 text-xs mt-4">Secure login with Google. OTP is disabled in v2.0.</p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetForm();
              }}
              disabled={loading}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {isSignUp ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
