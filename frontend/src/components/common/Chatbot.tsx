import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, X, Send, Bot, User, Loader2, RefreshCw,
  Mic, MicOff, Volume2, VolumeX, Check, Tractor, Phone, PhoneOff, Sprout
} from "lucide-react";
import API, { getBaseURL } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

// ─── Types ───────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }
interface BookingDetails { serviceId: number; date: string; location: string; hours: number; }

// ─── Speech Recognition ──────────────────────────────────────────────
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ─── Localized Prompts ───────────────────────────────────────────────
const L10N: Record<string, { greeting: string; placeholder: string; suggestions: string[] }> = {
  en: {
    greeting: "🌱 Namaste! I'm **Seed**, your agricultural AI assistant. Ask me anything about farming or booking machinery!",
    placeholder: "Ask Seed...",
    suggestions: ["Book a tractor", "What is KisanSeeva?", "How to register?", "Best crops for summer?"]
  },
  te: {
    greeting: "🌱 నమస్కారం! నేను **సీడ్ (Seed)**, మీ వ్యవసాయ సహాయకుడిని. యంత్రాల బుకింగ్ లేదా వ్యవసాయం గురించి ఏదైనా అడగండి!",
    placeholder: "సీడ్‌ని అడగండి...",
    suggestions: ["ట్రాక్టర్ బుక్ చేయి", "కిసాన్ సేవా అంటే ఏమిటి?", "నమోదు ఎలా చేయాలి?", "వేసవి పంటలు?"]
  },
  hi: {
    greeting: "🌱 नमस्ते! मैं **सीड (Seed)** हूँ, आपका कृषि सहायक। खेती या मशीनरी बुकिंग के बारे में कुछ भी पूछें!",
    placeholder: "सीड से पूछें...",
    suggestions: ["ट्रैक्टर बुक करें", "किसान सेवा क्या है?", "रजिस्टर कैसे करें?", "गर्मी में फसलें?"]
  },
  ta: {
    greeting: "🌱 வணக்கம்! நான் **சீட் (Seed)**, உங்கள் விவசாய உதவியாளர். எதையும் கேளுங்கள்!",
    placeholder: "சீட்டிடம் கேளுங்கள்...",
    suggestions: ["டிராக்டர் முன்பதிவு", "கிசான் சேவா என்ன?", "எப்படி பதிவு செய்வது?"]
  },
  kn: {
    greeting: "🌱 ನಮಸ್ಕಾರ! ನಾನು **ಸೀಡ್ (Seed)**, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಕೇಳಿ!",
    placeholder: "ಸೀಡ್ ಅವರನ್ನು ಕೇಳಿ...",
    suggestions: ["ಟ್ರ್ಯಾಕ್ಟರ್ ಬುಕ್ ಮಾಡಿ", "ಕಿಸಾನ್ ಸೇವಾ ಏನು?"]
  },
  mr: {
    greeting: "🌱 नमस्कार! मी **सीड (Seed)** आहे, तुमचा शेती सहाय्यक. विचारा!",
    placeholder: "सीडला विचारा...",
    suggestions: ["ट्रॅक्टर बुक करा", "किसान सेवा म्हणजे काय?"]
  },
  bn: {
    greeting: "🌱 নমস্কার! আমি **সিড (Seed)**, আপনার কৃষি সহকারী। জিজ্ঞাসা করুন!",
    placeholder: "সিডকে জিজ্ঞাসা করুন...",
    suggestions: ["ট্র্যাক্টর বুক করুন", "কিষান সেবা কী?"]
  }
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\[BOOKING_READY:.*?\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[`#*_~>[\]()|]/g, " ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function speakWithBackendTTS(text: string, langCode: string): HTMLAudioElement {
  const clean = stripMarkdown(text).slice(0, 250);
  if (!clean) return new Audio();
  const encoded = encodeURIComponent(clean);
  const backendUrl = getBaseURL();
  const url = `${backendUrl}/tts?text=${encoded}&lang=${langCode}`;
  const audio = new Audio(url);
  audio.volume = 1.0;
  return audio;
}

// ─── Format message to HTML ──────────────────────────────────────────
function fmt(text: string) {
  return text
    .replace(/\[BOOKING_READY:.*?\]/g, "").trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ─── Main Component ──────────────────────────────────────────────────
export default function Chatbot() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [botReply, setBotReply] = useState("");
  const [pendingBooking, setPendingBooking] = useState<BookingDetails | null>(null);
  const [bookingStatus, setBookingStatus] = useState<"none" | "submitting" | "success" | "error">("none");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLiveRef = useRef(false);
  isLiveRef.current = isLiveVoice;

  const l10n = L10N[currentLanguage.code] || L10N.en;

  // Initial greeting when opened or language changes
  useEffect(() => {
    if (isOpen) {
      setMessages([{ role: "assistant", content: l10n.greeting }]);
    }
  }, [isOpen, currentLanguage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speech Recognition setup
  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = currentLanguage.sttCode;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => {
      setIsListening(false);
      if (isLiveRef.current && !isBotSpeaking) restartListening(800);
    };
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        setVoiceTranscript(transcript);
        sendMessage(transcript);
      }
    };
    recRef.current = rec;
  }, [currentLanguage]);

  const restartListening = (delay = 600) => {
    setTimeout(() => {
      if (isLiveRef.current && recRef.current) {
        try { recRef.current.start(); } catch {}
      }
    }, delay);
  };

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const targetLang = currentLanguage.sttCode.split("-")[0];
    const audio = speakWithBackendTTS(text, targetLang);
    audioRef.current = audio;
    setIsBotSpeaking(true);

    audio.play().catch(() => {
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(text).slice(0, 200);
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.lang = currentLanguage.sttCode;
      
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLang) || v.lang.includes(targetLang)
      );
      if (matchedVoice) utt.voice = matchedVoice;
      utt.rate = 1.0;
      utt.onend = () => { setIsBotSpeaking(false); onDone?.(); };
      utt.onerror = () => { setIsBotSpeaking(false); onDone?.(); };
      window.speechSynthesis.speak(utt);
    });

    audio.onended = () => {
      setIsBotSpeaking(false);
      onDone?.();
    };
    audio.onerror = () => {
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(text).slice(0, 200);
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.lang = currentLanguage.sttCode;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLang) || v.lang.includes(targetLang)
      );
      if (matchedVoice) utt.voice = matchedVoice;
      utt.rate = 1.0;
      utt.onend = () => { setIsBotSpeaking(false); onDone?.(); };
      utt.onerror = () => { setIsBotSpeaking(false); onDone?.(); };
      window.speechSynthesis.speak(utt);
    };
  }, [currentLanguage]);

  const toggleMic = () => {
    if (!SR) { alert("Speech recognition requires Chrome or Edge."); return; }
    if (isListening) {
      recRef.current?.stop();
    } else {
      if (audioRef.current) { audioRef.current.pause(); setIsBotSpeaking(false); }
      window.speechSynthesis.cancel();
      try { recRef.current?.start(); } catch {}
    }
  };

  const startLiveVoice = () => {
    if (!SR) { alert("Speech recognition requires Chrome or Edge."); return; }
    setIsLiveVoice(true);
    setVoiceTranscript("");
    setBotReply("");
    setTimeout(() => {
      try { recRef.current?.start(); } catch {}
    }, 400);
  };

  const endLiveVoice = () => {
    setIsLiveVoice(false);
    recRef.current?.stop();
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis.cancel();
    setIsBotSpeaking(false);
    setIsListening(false);
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    if (pendingBooking && bookingStatus === "none") {
      const lower = content.toLowerCase();
      if (/confirm|yes|ok|సరే|हाँ|ஆம்|ಹೌದು|हो/.test(lower)) { confirmBooking(); setInput(""); return; }
      if (/cancel|no|stop|వద్దు|नहीं|இல்லை|ಬೇಡ/.test(lower)) { cancelBooking(); setInput(""); return; }
    }

    const userMsg: Message = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    if (pendingBooking) { setPendingBooking(null); setBookingStatus("none"); }

    try {
      const res = await API.post("/chat", {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        language: currentLanguage.code
      });

      const reply: string = res.data.reply;

      const match = reply.match(/\[BOOKING_READY:\s*(.*?)\]/);
      if (match) {
        try { setPendingBooking(JSON.parse(match[1])); setBookingStatus("none"); } catch {}
      }

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setBotReply(reply.replace(/\[BOOKING_READY:.*?\]/g, "").trim());

      speak(reply, () => {
        if (isLiveRef.current) restartListening(400);
      });

    } catch {
      const err = "Sorry, something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: err }]);
      if (isLiveRef.current) restartListening(800);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const confirmBooking = async () => {
    if (!pendingBooking) return;
    setBookingStatus("submitting");
    try {
      if (!localStorage.getItem("token")) throw new Error("Not logged in.");
      await API.post("/bookings", {
        serviceId: pendingBooking.serviceId,
        bookingDate: pendingBooking.date,
        hoursRequired: pendingBooking.hours,
        location: pendingBooking.location,
      });
      setBookingStatus("success");
      const msg = "🎉 Booking submitted successfully! Redirecting to your bookings...";
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
      speak(msg);
      setPendingBooking(null);
      setTimeout(() => navigate("/farmer/bookings"), 2500);
    } catch (e: any) {
      setBookingStatus("error");
      const msg = `❌ Booking failed: ${e.response?.data?.message || e.message}`;
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
    }
  };

  const cancelBooking = () => {
    setPendingBooking(null); setBookingStatus("none");
    const msg = "Booking cancelled. How can I help you?";
    setMessages(prev => [...prev, { role: "assistant", content: msg }]);
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: l10n.greeting }]);
    setPendingBooking(null); setBookingStatus("none");
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis.cancel();
  };

  // ══════════════════════════════════════════════════════════════════
  //  LIVE VOICE CALL UI  (fullscreen overlay)
  // ══════════════════════════════════════════════════════════════════
  if (isOpen && isLiveVoice) {
    return (
      <div className="fixed inset-0 z-[999] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center select-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5 text-white/90 text-sm font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Seed 🌱 · Live Call ({currentLanguage.nativeName})
          </div>
          <button
            onClick={endLiveVoice}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer text-white"
            title="Close call"
            aria-label="Close live call"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar + pulse rings */}
        <div className="relative flex items-center justify-center mb-8">
          {(isListening || isBotSpeaking) && <>
            <span className="absolute w-52 h-52 rounded-full border-2 border-emerald-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
            <span className="absolute w-40 h-40 rounded-full border-2 border-emerald-400/30 animate-ping" style={{ animationDuration: "1.1s" }} />
          </>}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isBotSpeaking ? "bg-emerald-500 scale-110 shadow-emerald-500/50" :
            isListening   ? "bg-red-500 scale-105 shadow-red-500/50" :
            "bg-emerald-700"
          }`}>
            {isBotSpeaking
              ? <Volume2 size={44} className="text-white animate-bounce" />
              : isListening
              ? <Mic size={44} className="text-white animate-pulse" />
              : <Sprout size={44} className="text-white" />
            }
          </div>
        </div>

        {/* Status label */}
        <p className="text-white text-2xl font-extrabold mb-2">
          {isBotSpeaking ? "Seed is speaking..." : isListening ? "Listening to you..." : loading ? "Thinking..." : "Seed 🌱"}
        </p>
        <p className="text-emerald-300/70 text-sm font-medium mb-8">
          {isBotSpeaking ? "Seed is talking — speak when done" : isListening ? "Speak now..." : loading ? "Processing request..." : "Press mic to speak"}
        </p>

        {/* Transcript cards */}
        <div className="w-full max-w-sm px-6 space-y-3 mb-10">
          {voiceTranscript && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-right">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">You said</p>
              <p className="text-white text-sm font-semibold">{voiceTranscript}</p>
            </div>
          )}
          {botReply && (
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl px-4 py-3">
              <p className="text-[10px] text-emerald-300/60 font-bold uppercase mb-1">Seed replied</p>
              <p className="text-white/90 text-sm">{botReply.slice(0, 160)}{botReply.length > 160 ? "…" : ""}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
              isListening ? "bg-red-600 animate-pulse" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {isListening ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
          </button>

          <button
            onClick={endLiveVoice}
            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-2xl transition-all cursor-pointer"
            title="End Call"
          >
            <PhoneOff size={32} className="text-white" />
          </button>

          <button
            onClick={() => { if (audioRef.current) audioRef.current.pause(); window.speechSynthesis.cancel(); setIsBotSpeaking(false); }}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Mute Audio"
          >
            <VolumeX size={26} className="text-white" />
          </button>
        </div>

        <p className="absolute bottom-6 text-white/30 text-xs">Tap red button to end call</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  REGULAR CHAT UI
  // ══════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-emerald-600 to-green-700 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-200 flex items-center gap-2.5 group cursor-pointer border-2 border-emerald-400/30"
          aria-label="Open Seed AI assistant"
        >
          <div className="relative">
            <Sprout size={26} className="text-emerald-100" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
          </div>
          <span className="font-extrabold text-sm max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap pr-1 text-white">
            Seed 🌱
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 bg-white"
          style={{ height: "82vh", maxHeight: "640px" }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-green-800 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sprout size={20} className="text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-none flex items-center gap-1">
                  Seed <span className="text-xs">🌱</span>
                </p>
                <p className="text-[11px] text-emerald-100/80 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Online · {currentLanguage.nativeName}
                </p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={startLiveVoice}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                title="Start hands-free voice call"
              >
                <Phone size={13} /> Call
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer text-emerald-100 hover:text-white"
                title="Clear conversation"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer text-emerald-100 hover:text-white"
                title="Close Chat"
                aria-label="Close Chat"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"} items-end`}>
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${m.role === "user" ? "bg-slate-700" : "bg-emerald-700"}`}>
                  {m.role === "user" ? <User size={12} /> : <Sprout size={13} />}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-slate-800 text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
                  <Sprout size={13} className="text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Pending booking card */}
            {pendingBooking && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Tractor size={15} className="text-emerald-700" /> Confirm Booking?
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong>Service:</strong> #{pendingBooking.serviceId}</p>
                  <p><strong>Date:</strong> {pendingBooking.date}</p>
                  <p><strong>Hours:</strong> {pendingBooking.hours}</p>
                  <p><strong>Location:</strong> {pendingBooking.location}</p>
                </div>
                {bookingStatus === "none" && (
                  <div className="flex gap-2">
                    <button onClick={cancelBooking} className="flex-1 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={confirmBooking} className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                      <Check size={13} /> Confirm
                    </button>
                  </div>
                )}
                {bookingStatus === "submitting" && (
                  <div className="flex justify-center py-1 text-xs text-emerald-800 font-bold items-center gap-1.5">
                    <Loader2 className="animate-spin" size={14} /> Submitting...
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Suggested Questions ── */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {l10n.suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap text-[11px] bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 font-semibold px-2.5 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 transition shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ── */}
          <div className="px-3 py-2.5 bg-white border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:bg-white transition">
              <button
                onClick={toggleMic}
                className={`p-1.5 rounded-xl transition cursor-pointer ${isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-emerald-700"}`}
                title={isListening ? "Stop listening" : `Speak (${currentLanguage.nativeName})`}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={l10n.placeholder}
                disabled={loading}
                className="flex-1 bg-transparent border-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
