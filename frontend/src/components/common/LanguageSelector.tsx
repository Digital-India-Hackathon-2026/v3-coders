import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface LanguageSelectorProps {
  variant?: "default" | "compact" | "dark";
}

export default function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonStyle =
    variant === "dark"
      ? "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
      : variant === "compact"
      ? "bg-white/90 text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs px-2.5 py-1.5"
      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-3 py-2 text-sm";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl font-bold transition shadow-sm cursor-pointer ${buttonStyle}`}
      >
        <Globe size={16} className="text-green-600 shrink-0" />
        <span className="truncate">{currentLanguage.nativeName}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Select Language
          </div>
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                currentLanguage.code === lang.code
                  ? "bg-green-50 text-green-700 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {lang.name !== lang.nativeName && (
                  <span className="text-[10px] text-slate-400 font-normal">({lang.name})</span>
                )}
              </div>
              {currentLanguage.code === lang.code && <Check size={14} className="text-green-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
