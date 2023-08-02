import { GetBaseUrl } from "@/app/utility/GetBaseUrl";
import { SimplifiedPlaylistObject } from "../../interfaces/SpotifyInterfaces";
import Image from "next/image";
import { useContext } from "react";
import { AuthContext } from "@/app/contexts/AuthContext";

export function SpotifyPlaylistCard({
  playlist,
}: {
  playlist: SimplifiedPlaylistObject;
}) {
  const authContext = useContext(AuthContext);

  const openPlaylistInNewTab = () => {
    window.open(playlist.external_urls.spotify, "_blank");
  };

  return (
    <a
      href={playlist.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col bg-neutral-600 p-2 items-center justify-center rounded-lg hover:cursor-pointer w-60 sm:w-auto sm:h-auto"
      style={{
        position: "relative",
        paddingTop: "100%",
      }}
      onClick={openPlaylistInNewTab}
    >
      <button
        className="h-12 hover:bg-primary/90 w-12 rounded-full bg-primary p-1 flex items-center justify-center z-20 text-primary-foreground"
        onClick={async () => {
          if (!authContext?.currentUser) return;

          console.log("Sending request");
          // Send the request to modify title
          const response = await fetch(
            `${GetBaseUrl()}api/user/spotify/playlists/modify?uid=${
              authContext.currentUser.uid
            }`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                playlist_id: playlist.id,
                modifications: {
                  title: "New title",
                },
              }),
            }
          );

          console.log("Response", response.status);
        }}
      >
        ...
      </button>
      <div
        className="absolute top-0 left-0 w-full h-full z-10 opacity-0 hover:opacity-100 duration-75"
        style={{
          backgroundColor: "rgba(37, 53, 205)",
          background:
            "linear-gradient(355deg, rgba(61,72,177,0.45) 0%, rgba(33,53,57,0.25) 100%)",
          filter:
            "progid:DXImageTransform.Microsoft.gradient(startColorstr='#2535cd',endColorstr='#5a0880',GradientType=1)",
        }}
      />
      <Image
        src={`${playlist.images[0].url}`}
        width={640}
        height={640}
        className="z-0"
        alt="Playlist image"
        style={{
          position: "absolute",
          padding: 0,
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <Image
        className="z-10 absolute -top-3 -left-3"
        src={
          "https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
        }
        width={44}
        height={44}
        alt={"Spotify Playlist"}
      />
      <h1 className="z-10 text-4xl text  font-bold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)] pointer-events-none text-gray-100">
        {playlist.name}
      </h1>
    </a>
  );
}
