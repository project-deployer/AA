import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoIntro from "./LogoIntro";
import FeatureOverview from "./FeatureOverview";
import LoginScreen from "./LoginScreen";

type Step = "logo" | "features" | "login";

export default function LaunchFlow() {
  const [step, setStep] = useState<Step>("logo");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step !== "logo") return;
    const t = setTimeout(() => setStep("features"), 2500);
    return () => clearTimeout(t);
  }, [step]);

  const onFeaturesNext = () => setStep("login");

  if (step === "logo") return <LogoIntro />;
  if (step === "features") return <FeatureOverview onNext={onFeaturesNext} />;
  return <LoginScreen onBack={() => setStep("features")} />;
}
