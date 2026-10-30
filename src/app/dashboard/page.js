"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { watchAuthState } from "@/backend/Auth/main";
import { signOutEmail } from "@/backend/Auth/main";

export default function Dashbaord() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Wait for Firebase to restore the persisted session before rendering
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
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="dashboard">Loading...</div>;
  }

  const triggerSignOut = () => {
    signOutEmail(auth)
      .then(() => {
        alert("Signed Out!");
      })
      .catch((error) => {
        const errorMessage = error.message;
        const errorCode = error.code;

        alert(errorMessage);
      });
  };

  return (
    <div className="dashboard">
      <h1>Hello {user.email}</h1>
      <button onClick={triggerSignOut}>Sign out</button>
    </div>
  );
}
