"use client";
import Sidebar from "@/components/Sidebar/Sidebar";
import React from "react";
import "./layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <div className="sidebar-area">
        <Sidebar></Sidebar>
      </div>
      <div className="content-area">{children}</div>
    </div>
  );
}
