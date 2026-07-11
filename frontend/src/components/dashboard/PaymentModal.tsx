import React, { useState } from "react";
import { CreditCard, Smartphone, Check, Loader2, DollarSign, User, ShieldCheck } from "lucide-react";
import { KSModal, KSButton } from "../ui";
import API from "../../services/api";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  totalPrice: number;
  onSuccess: () => void;
}

type PaymentMethod = "upi" | "card" | "cod";

export default function PaymentModal({ isOpen, onClose, bookingId, totalPrice, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [step, setStep] = useState<"select" | "details" | "processing" | "success">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card details form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI details form state
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        setError("Invalid card number. Must be 16 digits.");
        return;
      }
      if (!cardExpiry.includes("/")) {
        setError("Invalid expiry date.");
        return;
      }
      if (cardCvv.length !== 3) {
        setError("Invalid CVV.");
        return;
      }
      if (!cardName.trim()) {
        setError("Cardholder name is required.");
        return;
      }
    } else if (method === "upi") {
      if (!upiId.includes("@") || upiId.length < 5) {
        setError("Please enter a valid UPI ID (e.g. name@upi).");
        return;
      }
    }

    setStep("processing");
    setLoading(true);

    try {
      await API.post(`/bookings/${bookingId}/pay`, {
        paymentMethod: method
      });

      setTimeout(() => {
        setStep("success");
        setLoading(false);
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset modal states
          setStep("select");
          setCardNumber("");
          setCardExpiry("");
          setCardCvv("");
          setCardName("");
          setUpiId("");
        }, 2000);
      }, 1500); // simulated processing delay

    } catch (err: any) {
      setLoading(false);
      setStep("details");
      setError(err.response?.data?.message || "Payment transaction failed. Please try again.");
    }
  };

  return (
    <KSModal 
      isOpen={isOpen} 
      onClose={() => {
        if (step !== "processing" && step !== "success") {
          onClose();
          setStep("select");
          setError("");
        }
      }} 
      title={`Pay for Booking (KS-${bookingId})`}
    >
      <div className="space-y-6">
        {/* Step 1: Processing */}
        {step === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin text-green-600" />
            <p className="text-slate-600 font-medium">Contacting secure gateway...</p>
            <p className="text-xs text-slate-400">Do not refresh this page or close the window.</p>
          </div>
        )}

        {/* Step 2: Success */}
        {step === "success" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Check size={36} strokeWidth={3} />
            </div>
            <p className="text-xl font-bold text-slate-800">Payment Successful!</p>
            <p className="text-sm text-green-700 font-semibold">₹{totalPrice.toLocaleString("en-IN")} Received</p>
            <p className="text-xs text-slate-400">Updating your booking log...</p>
          </div>
        )}

        {/* Step 3: Select Payment Method */}
        {step === "select" && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Amount to Pay:</span>
              <span className="text-xl font-extrabold text-slate-800">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Choose Payment Method</p>
              
              {/* UPI Option */}
              <div 
                onClick={() => setMethod("upi")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
                  method === "upi" ? "border-green-600 bg-green-50/30" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl ${method === "upi" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Smartphone size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">UPI (Google Pay, PhonePe, Paytm)</p>
                  <p className="text-xs text-slate-400">Instant transfer using VPA address</p>
                </div>
              </div>

              {/* Card Option */}
              <div 
                onClick={() => setMethod("card")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
                  method === "card" ? "border-green-600 bg-green-50/30" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl ${method === "card" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <CreditCard size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">Debit / Credit Card</p>
                  <p className="text-xs text-slate-400">Visa, Mastercard, RuPay, Maestro</p>
                </div>
              </div>

              {/* COD Option */}
              <div 
                onClick={() => setMethod("cod")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
                  method === "cod" ? "border-green-600 bg-green-50/30" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl ${method === "cod" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <DollarSign size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">Cash on Delivery (COD)</p>
                  <p className="text-xs text-slate-400">Pay directly to the provider in cash</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <KSButton variant="outline" className="w-1/2 justify-center" onClick={onClose}>Cancel</KSButton>
              <KSButton 
                className="w-1/2 justify-center"
                onClick={() => {
                  if (method === "cod") {
                    setStep("processing");
                    setTimeout(async () => {
                      try {
                        await API.post(`/bookings/${bookingId}/pay`, { paymentMethod: "cod" });
                        setStep("success");
                        setTimeout(() => {
                          onSuccess();
                          onClose();
                          setStep("select");
                        }, 2000);
                      } catch (err: any) {
                        setStep("select");
                        setError(err.response?.data?.message || "Failed to initiate Cash payment.");
                      }
                    }, 1000);
                  } else {
                    setStep("details");
                  }
                }}
              >
                Continue
              </KSButton>
            </div>
          </div>
        )}

        {/* Step 4: Details Entry */}
        {step === "details" && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center mb-1">
              <span className="text-sm text-slate-500 font-medium">Paying:</span>
              <span className="text-base font-extrabold text-slate-800">₹{totalPrice.toLocaleString("en-IN")} via {method.toUpperCase()}</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-650 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-red-100">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* UPI Details */}
            {method === "upi" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Enter UPI ID</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. user@okaxis, 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: "gpay", label: "Google Pay" },
                    { id: "phonepe", label: "PhonePe" },
                    { id: "paytm", label: "Paytm" }
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        selectedUpiApp === app.id ? "bg-green-50 text-green-700 border-green-300" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card Details */}
            {method === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cardholder Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="***"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
              <ShieldCheck size={14} className="text-green-600 shrink-0" />
              Your payment credentials are encrypted & simulated securely for DIH-2026.
            </div>

            <div className="flex gap-4 pt-3">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5"
              >
                Pay ₹{totalPrice.toLocaleString("en-IN")}
              </button>
            </div>
          </form>
        )}
      </div>
    </KSModal>
  );
}
