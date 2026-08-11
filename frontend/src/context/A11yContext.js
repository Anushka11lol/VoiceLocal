import { createContext, useContext, useEffect, useState } from "react";

const A11yContext = createContext(null);

export function A11yProvider({ children }) {
  const [screenReader, setScreenReader] = useState(
    () => localStorage.getItem("vl_sr") === "on"
  );
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    localStorage.setItem("vl_sr", screenReader ? "on" : "off");
    document.documentElement.setAttribute(
      "data-screen-reader",
      screenReader ? "on" : "off"
    );
  }, [screenReader]);

  const announce = (msg) => {
    if (!screenReader) return;
    setAnnouncement("");
    setTimeout(() => setAnnouncement(msg), 50);
  };

  return (
    <A11yContext.Provider
      value={{ screenReader, setScreenReader, announce }}
    >
      {children}
      <div aria-live="assertive" role="status" className="sr-only">
        {announcement}
      </div>
    </A11yContext.Provider>
  );
}

export const useA11y = () => useContext(A11yContext);
