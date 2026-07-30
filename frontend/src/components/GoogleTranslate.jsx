import { useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

const SCRIPT_ID = "google-translate-element-script";
const ELEMENT_ID = "google_translate_element";

function setGoogleTranslateCookie(value) {
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=; path=/; ${expires}`;

  if (window.location.hostname.includes(".")) {
    document.cookie = `googtrans=; path=/; domain=.${window.location.hostname}; ${expires}`;
  }

  if (value) {
    document.cookie = `googtrans=${value}; path=/`;
    if (window.location.hostname.includes(".")) {
      document.cookie = `googtrans=${value}; path=/; domain=.${window.location.hostname}`;
    }
  }
}

function applyWidgetLanguage(language) {
  const select = document.querySelector(".goog-te-combo");
  if (!select) return false;

  const nextValue = language === "bn" ? "bn" : "";
  if (select.value === nextValue) return true;

  select.value = nextValue;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export default function GoogleTranslate() {
  const { language } = useLanguage();
  const previousLanguage = useRef(language);

  useEffect(() => {
    let cancelled = false;
    let retryTimer;

    const initialise = () => {
      if (cancelled || !window.google?.translate?.TranslateElement) return;
      if (!document.querySelector(`#${ELEMENT_ID} .goog-te-gadget`)) {
        // Google Website Translator translates the full rendered document,
        // including text that is not manually present in the local dictionary.
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "bn,en",
            autoDisplay: false,
          },
          ELEMENT_ID,
        );
      }

      retryTimer = window.setTimeout(() => applyWidgetLanguage(language), 250);
    };

    window.googleTranslateElementInit = initialise;

    if (window.google?.translate?.TranslateElement) {
      initialise();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.onerror = () => {
        // The existing hand-written Bangla dictionary remains as a graceful fallback.
      };
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    const changed = previousLanguage.current !== language;
    previousLanguage.current = language;

    if (language === "bn") {
      setGoogleTranslateCookie("/en/bn");
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (applyWidgetLanguage("bn") || attempts > 20) window.clearInterval(timer);
      }, 150);
      return () => window.clearInterval(timer);
    }

    setGoogleTranslateCookie("");

    // Restoring the original DOM is most reliable with a refresh after the
    // Google widget has replaced text nodes. This only runs on an actual switch.
    const hasTranslatedDom =
      document.documentElement.classList.contains("translated-ltr") ||
      document.documentElement.classList.contains("translated-rtl") ||
      document.body.classList.contains("translated-ltr") ||
      document.body.classList.contains("translated-rtl");

    if (changed && hasTranslatedDom) {
      window.location.reload();
      return undefined;
    }

    applyWidgetLanguage("en");
    return undefined;
  }, [language]);

  return (
    <div
      id={ELEMENT_ID}
      className="google-translate-host"
      aria-hidden="true"
    />
  );
}
