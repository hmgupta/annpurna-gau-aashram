import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { type Language, type TranslationKey, translations } from "./i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("gaushala-lang");
    return stored === "hi" || stored === "en" ? stored : "en";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("gaushala-lang", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] as string,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
