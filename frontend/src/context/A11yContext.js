import { createContext, useContext, useEffect, useRef, useState } from "react";

const A11yContext = createContext(null);

export function A11yProvider({ children }) {
  const [screenReader, setScreenReader] = useState(
    () => localStorage.getItem("vl_sr") === "on"
  );
  const [announcement, setAnnouncement] = useState("");
  const srRef = useRef(screenReader);

  useEffect(() => {
    srRef.current = screenReader;
    localStorage.setItem("vl_sr", screenReader ? "on" : "off");
    document.documentElement.setAttribute(
      "data-screen-reader",
      screenReader ? "on" : "off"
    );
    if (!screenReader && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [screenReader]);

  const speak = (msg) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg);
      u.rate = 1;
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    } catch {
      /* speech synthesis unavailable */
    }
  };

  const announce = (msg) => {
    if (!srRef.current || !msg) return;
    // Update aria-live region for assistive tech...
    setAnnouncement("");
    setTimeout(() => setAnnouncement(msg), 50);
    // ...and speak aloud so the toggle is audibly useful in-browser.
    speak(msg);
  };

  return (
    <A11yContext.Provider value={{ screenReader, setScreenReader, announce }}>
      {children}
      <div aria-live="assertive" role="status" className="sr-only" data-testid="sr-live-region">
        {announcement}
      </div>
    </A11yContext.Provider>
  );
}

export const useA11y = () => useContext(A11yContext);
