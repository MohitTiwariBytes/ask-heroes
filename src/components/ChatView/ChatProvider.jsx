"use client";

import React, { createContext, useContext } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  return <ChatContext.Provider value={null}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
