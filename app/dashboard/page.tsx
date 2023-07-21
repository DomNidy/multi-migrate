"use client";
import { auth } from "firebase-admin";
import { StorageKeys } from "../interfaces/SpotifyInterfaces";
import { GetBaseUrl } from "../utility/GetBaseUrl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Auth, getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebase_options } from "../auth/GoogleAuthFlow";

export default function Dashboard() {
  initializeApp(firebase_options);
  // Read search params
  const searchParams = useSearchParams();

  const router = useRouter();
  // Gets auth instance (firebase)
  const [auth, setAuth] = useState<Auth>(getAuth());

  useEffect(() => {
    // Check if we have access token in url params
    let atParam: any = searchParams.get("at");
    // The state param is the state value we exchanged with spotify api
    let stateParam: any = searchParams.get("ts");
    console.log(
      atParam,
      stateParam,
      localStorage.getItem("state") && atParam,
      auth.currentUser,
      auth
    );

    // When auth state changes
    onAuthStateChanged(auth, (user) => {
      // If user is signed in
      if (user) {
        // If our urls contain state param and access token (we should commit these to our database)
        if (
          stateParam &&
          stateParam == localStorage.getItem("state") &&
          atParam
        ) {
          // Make current UID own the spotify token in database
          fetch(
            `${GetBaseUrl()}api/user/spotify/token/make-owner?state=${stateParam}&uid=${
              user.uid
            }`,
            {
              method: "POST",
            }
          ).then(() => {
            // Set access token in local storage
            localStorage.setItem(StorageKeys.ACCESS_TOKEN, atParam);
            // Redirect to dashboard
            router.push(`${GetBaseUrl()}/dashboard`);
          });
        }
      }
    });
  });

  return (
    <div className="min-h-screen w-full bg-neutral-200">
      <h1 className="text-3xl text-gray-800 font-bold">Dashboard</h1>
    </div>
  );
}