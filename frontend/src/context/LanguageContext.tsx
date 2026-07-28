import React, { createContext, useState, useEffect, useContext } from "react";
import { UI_TRANSLATIONS } from "../utils/translations";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  sttCode: string; // Speech-to-text / TTS language code
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", sttCode: "en-IN", flag: "🇬🇧" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", sttCode: "te-IN", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", sttCode: "hi-IN", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", sttCode: "ta-IN", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", sttCode: "kn-IN", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "మరాఠీ", sttCode: "mr-IN", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", sttCode: "bn-IN", flag: "🇮🇳" },
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (code: string) => void;
  supportedLanguages: LanguageOption[];
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageOption>(() => {
    const savedCode = localStorage.getItem("app_language");
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === savedCode);
    return found || SUPPORTED_LANGUAGES[0];
  });

  const setLanguage = (code: string) => {
    const selected = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (selected) {
      setCurrentLanguageState(selected);
      localStorage.setItem("app_language", selected.code);
    }
  };

  const t = (key: string): string => {
    const langDict = UI_TRANSLATIONS[currentLanguage.code] || UI_TRANSLATIONS.en;
    return langDict[key] || UI_TRANSLATIONS.en[key] || key;
  };

  useEffect(() => {
    // Keep html lang attribute synchronized
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
