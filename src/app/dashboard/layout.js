"use client";
import Sidebar from "@/components/Sidebar/Sidebar";
import { ChatProvider } from "@/components/ChatView/ChatProvider";
import React from "react";
import "./layout.css";

export default function DashboardLayout({ children }) {
  return (
    <ChatProvider>
      <div className="dashboard-layout">
        <div className="sidebar-area">
          <Sidebar></Sidebar>
        </div>
        <div className="content-area">{children}</div>
      </div>
    </ChatProvider>
  );
}
