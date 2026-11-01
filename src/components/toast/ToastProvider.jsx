"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import Toast from "./toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, success = false, onDone) =>
      setToast({ id: Date.now(), message, success, onDone }),
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          success={toast.success}
          onClose={() => {
            toast.onDone?.();
            setToast(null);
          }}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
