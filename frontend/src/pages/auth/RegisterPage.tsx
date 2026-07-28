import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { KSButton } from "../../components/ui";
import {
  Sprout, Tractor, AlertCircle, CheckCircle2, Eye, EyeOff,
  Camera, RefreshCw, MapPin, Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

type Role = "farmer" | "provider";

/* ────────── Selfie Camera Component ────────── */
interface SelfieCameraProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
}
const SelfieCamera: React.FC<SelfieCameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera access in your browser settings.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = canvasRef.current!.toDataURL("image/jpeg");
      onCapture(blob, url);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }, "image/jpeg", 0.92);
  };

  if (cameraError) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        {cameraError}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-56 mx-auto flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="animate-spin text-green-400" size={32} />
          </div>
        )}
        {/* Face guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-40 rounded-full border-2 border-white/40 border-dashed" />
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <KSButton type="button" onClick={capture} disabled={!cameraReady} className="w-full py-3 justify-center flex items-center gap-2">
        <Camera size={18} /> Take Selfie
      </KSButton>
    </div>
  );
};

/* ────────── Main RegisterPage ────────── */
const RegisterPage = () => {
  const [role, setRole] = useState<Role>("farmer");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // Step 1 — Basic Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — Role-specific structured info
  // Farmer fields
  const [farmerVillage, setFarmerVillage] = useState("");
  const [farmerDistrict, setFarmerDistrict] = useState("");
  const [farmerState, setFarmerState] = useState("");
  const [farmerLandSize, setFarmerLandSize] = useState("");
  const [farmerCrops, setFarmerCrops] = useState("");

  // Provider fields
  const [providerServiceType, setProviderServiceType] = useState("");
  const [providerMachineCount, setProviderMachineCount] = useState("");
  const [providerMachineDetails, setProviderMachineDetails] = useState("");
  const [providerArea, setProviderArea] = useState("");
  const [providerDistrict, setProviderDistrict] = useState("");
  const [providerState, setProviderState] = useState("");

  // Location coords (auto-detected)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Step 3 — Documents
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  // Increment to force SelfieCamera full remount on retake
  const [cameraKey, setCameraKey] = useState(0);

  const navigate = useNavigate();
  const { register: authRegister } = useAuth();

  const inputClass =
    "w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition text-slate-800 placeholder:text-slate-400 text-sm";

  /* ── Step 1 validation ── */
  const handleNext = () => {
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { setError("Please enter a valid 10-digit Indian phone number"); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setStep(2);
  };

  /* ── Auto-detect location ── */
  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not detect location. Please enter your district manually.");
      }
    );
  };

  /* ── Build extraInfo string from structured fields ── */
  const buildExtraInfo = () => {
    if (role === "farmer") {
      return `Village: ${farmerVillage}, District: ${farmerDistrict}, State: ${farmerState}, Land: ${farmerLandSize} acres, Crops: ${farmerCrops}`;
    } else {
      return `Service: ${providerServiceType}, Machines: ${providerMachineCount}, Details: ${providerMachineDetails}, Area of operation: ${providerArea}, District: ${providerDistrict}, State: ${providerState}`;
    }
  };

  /* ── Step 2 validation ── */
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "farmer") {
      if (!farmerVillage.trim()) { setError("Village/Town name is required"); return; }
      if (!farmerDistrict.trim()) { setError("District is required"); return; }
      if (!farmerState.trim()) { setError("State is required"); return; }
      if (!farmerLandSize.trim()) { setError("Land size is required"); return; }
      if (!farmerCrops.trim()) { setError("Crops grown is required"); return; }
    } else {
      if (!providerServiceType.trim()) { setError("Service type is required"); return; }
      if (!providerMachineCount.trim()) { setError("Number of machines is required"); return; }
      if (!providerMachineDetails.trim()) { setError("Machine details are required"); return; }
      if (!providerArea.trim()) { setError("Area of operation is required"); return; }
      if (!providerDistrict.trim()) { setError("District is required"); return; }
      if (!providerState.trim()) { setError("State is required"); return; }
    }

    // ✅ If user was already created (came back from Step 3), skip re-registration
    if (userId) {
      setStep(3);
      return;
    }

    const addressCity = role === "farmer" ? farmerDistrict : providerDistrict;
    const addressState = role === "farmer" ? farmerState : providerState;

    setLoading(true);
    try {
      const { user } = await authRegister({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        password,
        extraInfo: buildExtraInfo(),
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        addressCity,
        addressState,
      });
      setUserId(user.id);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3 document upload ── */
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadharFile) { setError("Please upload your Aadhaar card"); return; }
    if (!selfieBlob) { setError("Please take a selfie using the camera above"); return; }
    if (role === "provider" && !drivingLicenseFile) { setError("Driving license is required for service providers"); return; }
    if (!userId) { setError("Session expired. Please start over."); return; }

    const formData = new FormData();
    formData.append("userId", userId.toString());
    formData.append("aadhar", aadharFile);
    formData.append("selfie", selfieBlob, "selfie.jpg");
    if (drivingLicenseFile) formData.append("driving_license", drivingLicenseFile);

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const baseUrl = (API.defaults.baseURL || "").replace("/api", "");
      const res = await fetch(`${baseUrl}/api/auth/upload-documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }
      navigate("/pending-approval");
    } catch (err: any) {
      setError(err.message || "Failed to upload documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const SERVICE_TYPES = [
    "Tractor (Ploughing)",
    "Tractor (Rotavator)",
    "Harvester (Paddy)",
    "Harvester (Wheat)",
    "Sprayer / Pest Control",
    "Seed Sowing Machine",
    "Water Pump / Motor Repair",
    "General Machinery Repair",
    "Thresher",
    "Other",
  ];

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the KisanSeeva network — India's agricultural services platform"
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${s <= step ? "text-green-600" : "text-slate-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  s < step
                    ? "bg-green-500 border-green-500 text-white"
                    : s === step
                    ? "border-green-500 text-green-600"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              <span className="text-xs font-semibold hidden sm:block">
                {s === 1 ? "Basic Info" : s === 2 ? "Details" : "Verify"}
              </span>
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? "bg-green-400" : "bg-slate-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 mb-5">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ────────── STEP 1: Basic Info ────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Register As</label>
            <div className="grid grid-cols-2 gap-3">
              {(["farmer", "provider"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === r
                      ? "border-green-400 bg-green-50 text-green-700 font-bold shadow-sm shadow-green-100"
                      : "border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  {r === "farmer" ? <Sprout className="mb-2" size={26} /> : <Tractor className="mb-2" size={26} />}
                  <span className="text-sm capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number * <span className="text-slate-400 font-normal">(10 digits)</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" maxLength={10} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass + " pr-12"}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <KSButton type="button" onClick={handleNext} className="w-full py-4 text-center justify-center">
            Continue →
          </KSButton>
        </div>
      )}

      {/* ────────── STEP 2: Structured Details ────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-5">
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-800">
            <p className="font-semibold mb-0.5">Welcome, {name.split(" ")[0]}! 🌾</p>
            <p className="text-green-700">
              {role === "farmer"
                ? "Tell us about your farm so we can connect you with the right services."
                : "Tell us about your equipment and services so farmers can find you."}
            </p>
          </div>

          {/* Location auto-detect */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
            <MapPin size={18} className="text-blue-600 shrink-0" />
            <div className="flex-1 text-sm">
              {lat && lng
                ? <span className="text-green-700 font-semibold">✅ Location detected ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
                : <span className="text-slate-600">Auto-detect your location for nearby matching</span>
              }
            </div>
            <button type="button" onClick={detectLocation} disabled={locating} className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0 flex items-center gap-1">
              {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              {locating ? "Detecting..." : lat ? "Re-detect" : "Detect"}
            </button>
          </div>

          {role === "farmer" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Village / Town *</label>
                  <input value={farmerVillage} onChange={(e) => setFarmerVillage(e.target.value)} placeholder="e.g. Reddygudem" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">District *</label>
                  <input value={farmerDistrict} onChange={(e) => setFarmerDistrict(e.target.value)} placeholder="e.g. Warangal" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">State *</label>
                <input value={farmerState} onChange={(e) => setFarmerState(e.target.value)} placeholder="e.g. Telangana" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Land Size (acres) *</label>
                <input type="number" min="0.1" step="0.1" value={farmerLandSize} onChange={(e) => setFarmerLandSize(e.target.value)} placeholder="e.g. 5.5" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Crops You Grow *</label>
                <input value={farmerCrops} onChange={(e) => setFarmerCrops(e.target.value)} placeholder="e.g. Paddy, Cotton, Maize" className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Type *</label>
                <select value={providerServiceType} onChange={(e) => setProviderServiceType(e.target.value)} className={inputClass}>
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Number of Machines *</label>
                <input type="number" min="1" value={providerMachineCount} onChange={(e) => setProviderMachineCount(e.target.value)} placeholder="e.g. 2" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Machine Details (Make & Model) *</label>
                <textarea
                  rows={3}
                  value={providerMachineDetails}
                  onChange={(e) => setProviderMachineDetails(e.target.value)}
                  placeholder="e.g. Mahindra 475 DI Tractor (2021), John Deere 5050 E"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Area of Operation (km radius) *</label>
                <input value={providerArea} onChange={(e) => setProviderArea(e.target.value)} placeholder="e.g. 20 km around Warangal" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">District *</label>
                  <input value={providerDistrict} onChange={(e) => setProviderDistrict(e.target.value)} placeholder="e.g. Karimnagar" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">State *</label>
                  <input value={providerState} onChange={(e) => setProviderState(e.target.value)} placeholder="e.g. Telangana" className={inputClass} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <KSButton type="button" variant="outline" disabled={loading} onClick={() => { setStep(1); setError(""); }} className="w-1/3 py-4 text-center justify-center">
              ← Back
            </KSButton>
            <KSButton type="submit" disabled={loading} className="flex-1 py-4 text-center justify-center">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin w-4 h-4" /> Saving...
                </span>
              ) : "Next: Verify →"}
            </KSButton>
          </div>
        </form>
      )}

      {/* ────────── STEP 3: Documents & Selfie ────────── */}
      {step === 3 && (
        <form onSubmit={handleDocumentUpload} className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-800">
            <p className="font-semibold mb-0.5">Final Step: Identity Verification 📄</p>
            <p className="text-green-700">Upload Aadhaar, take a live selfie, and submit for admin approval.</p>
          </div>

          {/* Aadhaar Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aadhaar Card * <span className="text-xs font-normal text-slate-400">(JPG/PNG/PDF)</span></label>
            <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${aadharFile ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setAadharFile(e.target.files?.[0] || null)} className="hidden" id="aadhar-upload" />
              <label htmlFor="aadhar-upload" className="cursor-pointer">
                {aadharFile
                  ? <span className="text-sm font-semibold text-green-700">✅ {aadharFile.name}</span>
                  : <span className="text-sm text-slate-400">Click to upload Aadhaar</span>
                }
              </label>
            </div>
          </div>

          {/* Selfie via Camera */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Live Selfie * <span className="text-xs font-normal text-orange-500">⚠️ Camera capture only — no file uploads</span>
            </label>
            {selfiePreview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-square max-h-56 mx-auto">
                  <img src={selfiePreview} alt="selfie" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✅ Captured</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelfieBlob(null);
                    setSelfiePreview(null);
                    // Increment key to force a full camera remount with a fresh stream
                    setCameraKey((k) => k + 1);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-2xl py-2.5 hover:bg-slate-50 transition"
                >
                  <RefreshCw size={16} /> Retake Selfie
                </button>
              </div>
            ) : (
              <SelfieCamera
                key={cameraKey}
                onCapture={(blob, dataUrl) => {
                  setSelfieBlob(blob);
                  setSelfiePreview(dataUrl);
                }}
              />
            )}
          </div>

          {/* Driving License (Provider only) */}
          {role === "provider" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Driving License * <span className="text-xs font-normal text-slate-400">(JPG/PNG/PDF)</span></label>
              <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${drivingLicenseFile ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setDrivingLicenseFile(e.target.files?.[0] || null)} className="hidden" id="dl-upload" />
                <label htmlFor="dl-upload" className="cursor-pointer">
                  {drivingLicenseFile
                    ? <span className="text-sm font-semibold text-green-700">✅ {drivingLicenseFile.name}</span>
                    : <span className="text-sm text-slate-400">Click to upload Driving License</span>
                  }
                </label>
              </div>
            </div>
          )}

          <KSButton type="submit" disabled={loading} className="w-full py-4 text-center justify-center">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="animate-spin w-4 h-4" /> Uploading...
              </span>
            ) : "Submit for Verification 🚀"}
          </KSButton>
        </form>
      )}

      <div className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <span onClick={() => navigate("/login")} className="font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer">
          Sign in here
        </span>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
