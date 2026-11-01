import React from "react";
import { ChatProvider } from "@/components/ChatView/ChatProvider";

export default function ChatLayout({ children }) {
  return <ChatProvider>{children}</ChatProvider>;
}
