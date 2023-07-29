"use client";
import { getAuth, Auth, User } from "firebase/auth";
import { FirebaseApp, initializeApp } from "firebase/app";
import { useContext, useEffect, useState } from "react";
import SignInWithSpotify from "@/app/components/SignInWithSpotify";
import { UserPlaylists } from "@/app/interfaces/SpotifyInterfaces";
import { SpotifyPlaylistCard } from "@/app/components/SpotifyPlaylistCard";
import { useRouter } from "next/navigation";
import { GetBaseUrl } from "@/app/utility/GetBaseUrl";
import { getFirebaseApp } from "@/app/utility/GetFirebaseApp";
import Notification from "@/app/components/Notification";
import { UserContext } from "@/app/components/UserContext";

// TODO: REFACTOR CLIENT SIDE CODE TO USE AUTH CORRECTLY, ALSO SOMETHING SEEMS TO OF BROKEN WITH USERS BEING AUTHENTICATED ?

export default function Home() {
  getFirebaseApp();
  const userContext = useContext(UserContext);

  // If we are loading playlists
  const [loading, setLoading] = useState<boolean>(false);

  // Playlists returned from spotify api
  const [playlists, setPlaylists] = useState<UserPlaylists | undefined>();
  // Next router
  const router = useRouter();

  useEffect(() => {
    // Add auth state listener
    const listener = userContext!.auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => {
      listener();
    };
  });

  return (
    <div className="min-h-screen w-full ">
      <div className="pl-1 h-16 w-full bg-neutral-200 dark:bg-dm-800  text-4xl text-gray-200 font-semibold flex items-center pointer-events-none p-0">
        Playlists
      </div>
      <div className="p-5 flex flex-col gap-2">
        <h1>Signed in as {userContext?.user?.displayName}</h1>
        <SignInWithSpotify />
        <button
          className="bg-neutral-900 hover:bg-neutral-950 text-neutral-300 w-fit h-fit p-2 rounded-lg"
          onClick={async () => {
            // If we are logged in

            // TODO: Put the loading UI here use setPlaylists to mock playlists
            setLoading(true);

            if (userContext?.auth.currentUser) {
              const request = await fetch(
                `${GetBaseUrl()}api/user/spotify/playlists?uid=${
                  userContext?.user?.uid
                }`,
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    idtoken: await userContext.auth.currentUser.getIdToken(),
                  },
                  method: "POST",
                }
              );

              // If the request was okay
              if (request.ok) {
                const _playlists = await request.json();
                setLoading(false);

                setPlaylists(_playlists);
              } else {
                alert((await request.json())?.error);
              }
            }
          }}
        >
          Refresh playlists
        </button>
      </div>

      {playlists ? (
        <div className="flex justify-center mt-4">
          <div className="grid lg:grid-cols-3 xl:grid-cols-4 sm:grid-cols-2 gap-6 grid-flow-row-dense w-10/12 justify-center">
            {loading ? (
              <p className="text-black text-4xl">Loading playlists...</p>
            ) : (
              <></>
            )}

            {!loading &&
              playlists.items.map((playlist, idx) => (
                <SpotifyPlaylistCard playlist={playlist} key={idx} />
              ))}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
