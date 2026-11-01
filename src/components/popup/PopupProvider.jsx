"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import Popup from "./popup";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);

  // Resolves with the chosen option's `value` (or null if dismissed) once the
  // popup has animated out. Each option may also carry its own `onClick`.
  const showPopup = useCallback(
    ({ title, message, options = [], dismissible = true }) =>
      new Promise((resolve) =>
        setPopup({ id: Date.now(), title, message, options, dismissible, resolve }),
      ),
    [],
  );

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      {popup && (
        <Popup
          key={popup.id}
          title={popup.title}
          message={popup.message}
          options={popup.options}
          dismissible={popup.dismissible}
          onClose={(option) => {
            setPopup(null);
            option?.onClick?.();
            popup.resolve(option ? (option.value ?? option.label) : null);
          }}
        />
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used inside <PopupProvider>");
  }
  return context;
}
