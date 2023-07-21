"use client";
import { getAuth, Auth, User } from "firebase/auth";
import { FirebaseApp, initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import SignedInWithGoogleCard from "@/app/components/SignedInWithGoogleCard";
import SignedInWithSpotifyCard from "@/app/components/SignedInWithSpotifyCard";
import { UserPlaylists } from "@/app/interfaces/SpotifyInterfaces";

import { SpotifyPlaylistCard } from "@/app/components/SpotifyPlaylistCard";
import { firebase_options } from "@/app/auth/GoogleAuthFlow";
import { useRouter } from "next/navigation";
import { GetBaseUrl } from "@/app/utility/GetBaseUrl";

export default function Home() {
  const [app, setApp] = useState<FirebaseApp>(initializeApp(firebase_options));

  // Gets auth instance
  const [auth, setAuth] = useState<Auth>(getAuth());

  // Reference to firebase user object
  const [firebaseUser, setFirebaseUser] = useState<User>();

  // This function is passed to the signincard to give it access to our user state
  const updateUserFirebase = (newUser: User) => {
    setFirebaseUser(newUser);
  };

  // Playlists returned from spotify api
  const [playlists, setPlaylists] = useState<UserPlaylists | undefined>();
  // Next router
  const router = useRouter();

  useEffect(() => {
    // Add auth state listener
    auth?.onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.push("/login");
      }
    });
  }, [auth, firebaseUser, router]);

  return (
    <div className="min-h-screen w-full bg-gray-200 p-5">
      <SignedInWithGoogleCard
        displayName={firebaseUser?.displayName}
        email={firebaseUser?.email}
        photoURL={firebaseUser?.photoURL}
        updateUser={updateUserFirebase}
      />
      <SignedInWithSpotifyCard />
      <button
        className="bg-neutral-900 hover:bg-neutral-950 text-neutral-300 w-fit h-fit p-2 rounded-lg"
        onClick={async () => {
          // If we are logged in
          if (auth.currentUser) {
            const request = await fetch(
              `${GetBaseUrl()}api/user/spotify/playlists?uid=${
                auth.currentUser.uid
              }`
            );

            // If the request was okay
            if (request.ok) {
              const _playlists = await request.json();
              setPlaylists(_playlists);
            } else {
              alert((await request.json())?.error);
            }
          }
        }}
      >
        Refresh playlists
      </button>
      <button
        className="bg-neutral-900 hover:bg-neutral-950 text-neutral-300 w-fit h-fit p-2 rounded-lg"
        onClick={() => auth.signOut()}
      >
        Sign out Google
      </button>
      {playlists ? (
        <div className="flex justify-center mt-6">
          <div className="grid lg:grid-cols-3 xl:grid-cols-4 sm:grid-cols-2 gap-6 grid-flow-row-dense w-10/12 justify-center">
            {playlists.items.map((playlist, idx) => (
              <SpotifyPlaylistCard playlist={playlist} key={idx} />
            ))}
          </div>
        </div>
      ) : (
        "No playlists found"
      )}
    </div>
  );
}