import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/app/firebase/SpotifyTokens";

async function fetchProfile(token: string): Promise<any> {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

export async function GET(req: NextRequest, res: NextResponse) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (uid == null) {
    return new NextResponse(
      JSON.stringify({
        error:
          "No UID was provided in api request, cannot fetch profile without it!",
      }),
      { status: 400 }
    );
  }

  if (uid) {
    const token = await getSpotifyToken(uid);

    // If we could not retreive a token, return
    if (token instanceof NextResponse) {
      return new NextResponse(JSON.stringify({error: "UID Was invalid or your UID does not have an assosciated spotify account connected."}), {
        status: 404,
      });
    }

    // If our token exists and is not expired
    if (
      token instanceof Object &&
      "access_token" in token &&
      "expires_in" in token
    ) {
      const result = await fetchProfile(token.access_token);

      return new NextResponse(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      });
    }
  }
}
