"use client";

import React, { useEffect, useRef, useState } from "react";
import { watchAuthState } from "@/backend/Auth/main";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Dashbaord() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(
    () =>
      watchAuthState(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
    router.push("/dashboard/chat");
  }, [loading, user, router]);

  return null;
}
