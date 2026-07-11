import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  MessageCircle, X, Send, Bot, User, Loader2, RefreshCw, 
  ChevronDown, Mic, MicOff, Volume2, VolumeX, Check, AlertCircle, Tractor 
} from "lucide-react";
import API from "../../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BookingDetails {
  serviceId: number;
  date: string;
  location: string;
  hours: number;
}

const SUGGESTED_QUESTIONS = [
  "I want to book a tractor",
  "What is KisanSeeva?",
  "What documents do I need to register?",
  "How does the pricing survey work?",
  "What crops grow best in summer?",
];

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const TypingIndicator = () => (
  <div className="flex items-end gap-2 max-w-[85%]">
    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0">
      <Bot size={14} className="text-white" />
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

function formatMessage(text: string) {
  // Strip out the [BOOKING_READY] tag for rendering
  const displayChat = text.replace(/\[BOOKING_READY:.*?\]/, "").trim();
  return displayChat
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/^[-•]\s(.+)/gm, '<span class="block pl-2 border-l-2 border-green-300 my-0.5">$1</span>');
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaOffline, setOllamaOffline] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  
  // Pending booking flow state
  const [pendingBooking, setPendingBooking] = useState<BookingDetails | null>(null);
  const [bookingStatus, setBookingStatus] = useState<"none" | "submitting" | "success" | "error">("none");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // 1. Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "🌾 Namaste! I'm **KisanSeevaBot**, your agricultural assistant.\n\nI can speak and book services for you!\n- Try saying: **'I want to book a tractor'**\n- Toggle the 🔊 icon to hear me speak!\n- Click the 🎙️ icon to speak to me!"
      }]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingBooking, bookingStatus]);

  // 2. Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set dialect to Indian English for better local accents

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          // Auto submit the user's spoken voice command
          sendMessage(transcript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [messages]);

  const toggleListen = () => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop talking when user starts speaking
      recognitionRef.current?.start();
    }
  };

  // 3. Text-to-Speech (TTS) response reader
  const speakText = (text: string) => {
    if (!isSpeakingEnabled) return;
    
    // Stop any active speech synthesis
    window.speechSynthesis.cancel();

    // Clean text: strip markdown characters and [BOOKING_READY] tag
    let cleanText = text
      .replace(/\[BOOKING_READY:.*?\]/, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-GB") || v.lang.includes("en-US"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setShowScroll(el.scrollTop < el.scrollHeight - el.clientHeight - 100);
  };

  // 4. Send message flow
  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    // Check if voice booking confirmation is expected
    if (pendingBooking && bookingStatus === "none") {
      const lower = content.toLowerCase();
      if (lower.includes("confirm") || lower.includes("yes") || lower.includes("ok")) {
        confirmVoiceBooking();
        setInput("");
        return;
      } else if (lower.includes("cancel") || lower.includes("no") || lower.includes("stop")) {
        cancelBookingFlow();
        setInput("");
        return;
      }
    }

    const userMsg: Message = { role: "user", content };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setOllamaOffline(false);
    
    // If user inputs a new search during pending booking, reset the booking card
    if (pendingBooking) {
      setPendingBooking(null);
      setBookingStatus("none");
    }

    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await axios.post("http://localhost:5000/api/chat", {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      }, config);

      const reply = res.data.reply;
      
      // Parse structured booking trigger tag: [BOOKING_READY: {"serviceId": 3, "date": "2026-07-15", ...}]
      const match = reply.match(/\[BOOKING_READY:\s*(.*?)\]/);
      if (match) {
        try {
          const bookingData = JSON.parse(match[1]) as BookingDetails;
          setPendingBooking(bookingData);
          setBookingStatus("none");
        } catch (e) {
          console.error("Booking JSON parse error", e);
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speakText(reply);
    } catch (err: any) {
      const isOffline = err.response?.data?.offline || err.response?.status === 503;
      setOllamaOffline(isOffline);
      const errMsg = isOffline
        ? "⚠️ I'm currently offline. Please make sure **Ollama** is running on your machine.\n\nRun this in your terminal:\n`ollama serve`\n\nThen try again."
        : "❌ Sorry, something went wrong. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
      speakText(errMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // 5. Complete Booking Action via API
  const confirmVoiceBooking = async () => {
    if (!pendingBooking) return;
    setBookingStatus("submitting");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to confirm a booking.");
      }
      
      await API.post("/bookings", {
        serviceId: pendingBooking.serviceId,
        bookingDate: pendingBooking.date,
        hoursRequired: pendingBooking.hours,
        location: pendingBooking.location,
      });

      setBookingStatus("success");
      const successMsg = "🎉 Awesome! Your booking request has been successfully submitted to the provider. Taking you to your bookings page...";
      setMessages(prev => [...prev, { role: "assistant", content: successMsg }]);
      speakText(successMsg);
      setPendingBooking(null);
      
      // Auto-redirect to My Bookings page after 3 seconds
      setTimeout(() => {
        navigate("/farmer/bookings");
      }, 3000);
    } catch (err: any) {
      setBookingStatus("error");
      const errText = err.response?.data?.message || err.message || "Booking submission failed.";
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Booking failed: ${errText}` }]);
      speakText(`Booking failed: ${errText}`);
    }
  };

  const cancelBookingFlow = () => {
    setPendingBooking(null);
    setBookingStatus("none");
    const cancelMsg = "No problem! I have cancelled the booking request. What would you like to do instead?";
    setMessages(prev => [...prev, { role: "assistant", content: cancelMsg }]);
    speakText(cancelMsg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setPendingBooking(null);
    setBookingStatus("none");
    setOllamaOffline(false);
    window.speechSynthesis.cancel();
    setTimeout(() => {
      setMessages([{
        role: "assistant",
        content: "🌾 Chat cleared! How can I help you today?"
      }]);
    }, 100);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open KisanSeeva Chatbot"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-slate-700 shadow-slate-500/30"
            : "bg-gradient-to-br from-green-500 to-green-700 shadow-green-600/40"
        }`}
      >
        <div className="relative">
          {isOpen ? (
            <X size={22} className="text-white" />
          ) : (
            <>
              <MessageCircle size={24} className="text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-white animate-pulse" />
            </>
          )}
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden flex flex-col" style={{ height: "550px" }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                  KisanSeevaBot 
                  {isListening && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${ollamaOffline ? "bg-red-400" : "bg-green-300 animate-pulse"}`} />
                  <span className="text-green-100 text-xs">{ollamaOffline ? "Offline" : isListening ? "Listening..." : "Online · Voice enabled"}</span>
                </div>
              </div>
            </div>
            
            {/* Control Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const state = !isSpeakingEnabled;
                  setIsSpeakingEnabled(state);
                  if (!state) window.speechSynthesis.cancel();
                }}
                title={isSpeakingEnabled ? "Disable speech feedback" : "Enable speech feedback"}
                className={`p-1.5 rounded-xl transition ${isSpeakingEnabled ? "bg-white/20 text-yellow-300" : "text-white/60 hover:text-white"}`}
              >
                {isSpeakingEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={clearChat}
                title="Clear chat history"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/60 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} max-w-[90%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-blue-500" : "bg-green-600"
                }`}>
                  {msg.role === "user" ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {loading && <TypingIndicator />}

            {/* Inline Booking Confirmation Card */}
            {pendingBooking && (
              <div className="bg-white rounded-2xl border-2 border-green-500 shadow-xl p-4 space-y-3 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-xl uppercase tracking-wider">
                  Voice Booking
                </div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Tractor className="text-green-600" size={16} />
                  Confirm Rental Request
                </h4>
                <div className="space-y-1.5 text-xs text-slate-650 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service ID:</span>
                    <span className="font-semibold text-slate-800">#{pendingBooking.serviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking Date:</span>
                    <span className="font-semibold text-slate-800">{pendingBooking.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-slate-800">{pendingBooking.hours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{pendingBooking.location}</span>
                  </div>
                </div>

                {bookingStatus === "error" && (
                  <div className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Failed to book. Check your login status.
                  </div>
                )}

                <div className="flex gap-2 text-xs pt-1.5">
                  <button
                    onClick={cancelBookingFlow}
                    disabled={bookingStatus === "submitting"}
                    className="flex-1 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmVoiceBooking}
                    disabled={bookingStatus === "submitting"}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-semibold flex items-center justify-center gap-1"
                  >
                    {bookingStatus === "submitting" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={12} /> Confirm
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-medium animate-pulse">
                  🔊 Say "confirm" or click to place booking.
                </p>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* Scroll Down Trigger */}
          {showScroll && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-24 right-10 bg-white border border-slate-200 shadow-md rounded-full p-1.5 text-slate-500 hover:text-green-600 hover:border-green-300 transition"
            >
              <ChevronDown size={16} />
            </button>
          )}

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-nowrap overflow-x-auto gap-1.5 shrink-0 bg-white border-t border-slate-100 pt-2 no-scrollbar">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition font-medium whitespace-nowrap disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
            {/* Voice Input Button */}
            <button
              onClick={toggleListen}
              disabled={loading}
              title={isListening ? "Listening... click to stop" : "Start speaking"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening to your voice..." : "Type or speak crop/booking questions..."}
              disabled={loading}
              className="flex-1 text-sm px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shrink-0 shadow-lg shadow-green-600/25"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

