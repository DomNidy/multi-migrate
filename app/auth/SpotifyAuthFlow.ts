"use client";
import { Router } from "next/router";
import { StorageKeys } from "../interfaces/SpotifyInterfaces";
import { GetBaseUrl } from "../utility/GetBaseUrl";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

// TODO: Read this from .env instead
export const CLIENT_ID = "7729d99a51604e58b7d7daca1fd4cb24";

console.log(CLIENT_ID);

export function clearLocalStorageSpotifyData() {
  localStorage.removeItem(StorageKeys.CODE);
  localStorage.removeItem(StorageKeys.CODE_CHALLENGE);
  localStorage.removeItem(StorageKeys.CODE_VERIFIER);
  localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
  localStorage.removeItem(StorageKeys.USER_PROFILE);

  console.log("Cleared local storage spotify data.");
}

function generateCodeVerifier(length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(
    String.fromCharCode.apply(null, [...new Uint8Array(digest)])
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  localStorage.setItem("challenge", challenge);

  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function redirectToAuthCodeFlow(
  clientId: string,
  router: AppRouterInstance
) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", `${GetBaseUrl()}callback`);
  params.append(
    "scope",
    "user-read-private user-read-email playlist-read-private"
  );
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function fetchProfile(
  token: string,
  router: AppRouterInstance
): Promise<any> {
  // TODO: This is here so we dont have to request spotify api as much, we can just store the user profile in local storage
  // TODO: This is only here for development (HMR causes page to reload a lot and thus request the api alot)
  // TODO: DISABLE THIS CODE TO RE-ENABLE PROPER FETCH BEHAVIOUR!
  if (localStorage.getItem("userProfile")) {
    return JSON.parse(localStorage.getItem("userProfile")!);
  }

  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

export async function loginSpotify(
  client_id: string,
  router: AppRouterInstance
) {
  // Generate a state value on client side (this will be returned from the spotify api, and the spotify api returned state should match the one stored in session storage, used to protect against csrf attacks)
  const state = generateCodeVerifier(128);
  localStorage.setItem("state", state);

  const params = new URLSearchParams();
  params.append("response_type", "code");
  params.append("client_id", client_id);
  params.append(
    "scope",
    "user-read-private user-read-email playlist-read-private"
  );
  params.append("redirect_uri", `${GetBaseUrl()}api/callback`);
  params.append("state", state);

  router.push(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
