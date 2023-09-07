/**
 * Creates external track objects from a spotify playlist
 * @param {any} playlistID :string
 * @param {any} accessToken :SpotifyAccessToken
 * @returns {any} `ExternalTrack[]`
 */

import { ExternalTrack } from "@/definitions/MigrationService";
import { SpotifyAccessToken } from "@/definitions/SpotifyInterfaces";
import { YoutubeAccessToken } from "@/definitions/YoutubeInterfaces";
import { google, youtube_v3 } from "googleapis";
import {
  iso8601DateToMilliseconds,
  iso8601DurationToMilliseconds,
} from "../utility/FormatDate";

export async function getExternalTracksFromSpotifyPlaylist(
  playlistID: string,
  accessToken: SpotifyAccessToken
): Promise<ExternalTrack[]> {
  const limit = 50;
  let offset = 0;

  let responses = [];

  const initialRequest = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistID}/tracks?fields=${encodeURIComponent(
      "items(track(name,id,artists.name,artists.id,duration_ms,external_ids, album(name,release_date,release_date_precision)))"
    )}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
    }
  );

  responses.push(await initialRequest.json());

  // While the most recent response has an items array length equal to that of the limit, send out requests
  while (responses.at(-1).items.length === limit) {
    // Increment the offset by the limit
    offset += limit;
    console.log(
      "Sending request to url",
      `https://api.spotify.com/v1/playlists/${playlistID}/tracks?fields=${encodeURIComponent(
        "items(track(name,id,artists.name,artists.id,duration_ms, external_ids, album(name,release_date,release_date_precision)))"
      )}&limit=${limit}&offset=${offset}`
    );

    responses.push(
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlistID}/tracks?fields=${encodeURIComponent(
          "items(track(name,id,artists.name,artists.id,duration_ms, external_ids, album(name,release_date,release_date_precision)))"
        )}&limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken.access_token}`,
          },
        }
      ).then(async (res) => await res.json())
    );
  }

  console.log(JSON.stringify(responses));

  // try to convert tracks into `SpotifyPlaylistExternalIDS` object
  const playlistExternalTracks: ExternalTrack[] = responses.flatMap(
    (response) =>
      response.items.map((data: any) => {
        const trackData: ExternalTrack = {
          // We are only reading the artist info from the first item in the array
          // There could be multiple artists, however this seems fine
          artist: {
            id: data.track.artists[0].id,
            name: data.track.artists[0].name,
          },
          title: data.track.name,
          platform_of_origin: "spotify",
          platform_id: data.track.id,
          external_ids: { ...data.track.external_ids },
          duration_ms: data.track.duration_ms,
          release_date_ms: iso8601DateToMilliseconds(
            data.track.album.release_date
          ),
        };
        return trackData;
      })
  );

  console.log("All external tracks", JSON.stringify(playlistExternalTracks));

  return playlistExternalTracks;
}
/**
 * Creates external track objects from a youtube playlist
 * @param {any} playlistID :string
 * @param {any} accessToken `YoutubeAccessToken`
 * @returns {any} `ExternalTrack[]`
 */

export async function getExternalTracksFromYoutubePlaylist(
  playlistID: string,
  accessToken: YoutubeAccessToken
): Promise<ExternalTrack[] | undefined> {
  try {
    // Create youtube api client
    const youtube = google.youtube("v3");

    // This is an array of all our playlist requests, as youtube has a maxresults of 50 per request
    // Each request is stored in this array.
    const allRequestPages: youtube_v3.Schema$PlaylistItemListResponse[] = [];

    // Request the playlist items

    const initialPlaylistRequest = await youtube.playlistItems.list({
      part: ["contentDetails"],
      access_token: accessToken.access_token,
      playlistId: playlistID,
      maxResults: 50,
    });

    let nextPageToken = initialPlaylistRequest.data.nextPageToken;

    // Add the initial request to request pages array
    allRequestPages.push(initialPlaylistRequest.data);

    // Check if we have more data to fetch (if a nextPageToken exists)
    while (nextPageToken) {
      console.log(
        "We have a next page token, sending out another request",
        nextPageToken
      );
      const playlistRequest = await youtube.playlistItems.list({
        part: ["contentDetails"],
        access_token: accessToken.access_token,
        playlistId: playlistID,
        pageToken: nextPageToken,
        maxResults: 50,
      });

      allRequestPages.push(playlistRequest.data);

      nextPageToken = playlistRequest.data.nextPageToken;
    }

    // For every item in the playlist, request the Videos.list endpoint so we can get the duration of the track
    // In the future, maybe try to restrict this feature to certain users (premium or whatever idk)
    // The Videos.list endpoint is 1 quota cost (per video)
    let playlistExternalTracks: ExternalTrack[] | undefined = [];

    for (let i = 0; i < allRequestPages.length; i++) {
      while (allRequestPages[i].items?.length) {
        // Splice 30 video ids from items
        const idsToRequest = allRequestPages[i].items
          ?.splice(0, 30)
          .map((item) => {
            console.log(item.contentDetails);
            return item.contentDetails?.videoId || "";
          });

        console.log("\nSpliced video ids", idsToRequest);

        // Request video.list endpoint
        const videoRequest = await youtube.videos.list({
          part: ["contentDetails", "id", "snippet", "status"],
          access_token: accessToken.access_token,
          id: idsToRequest,
        });

        // Create external tracks for each item
        videoRequest.data.items?.forEach((item, idx) => {
          console.log(JSON.stringify(item), "Item:", idx);

          playlistExternalTracks?.push({
            // We are only reading the artist info from the first item in the array
            // There could be multiple artists, however this seems fine
            artist: {
              id: item.snippet?.channelId!,
              name: item.snippet?.channelTitle!,
            },
            title: item.snippet?.title!,
            platform_of_origin: "youtube",
            platform_id: item.id!,
            // As of right now, we have no way of getting external ids from youtube tracks, so we just pass an empty object
            external_ids: {},
            description: item.snippet?.description!,
            release_date_ms: iso8601DateToMilliseconds(
              item.snippet?.publishedAt!
            ),
            duration_ms: iso8601DurationToMilliseconds(
              item.contentDetails?.duration || "PT0M1S"
            ),
          });
        });
      }
    }

    console.log(`All request pages ${JSON.stringify(allRequestPages)} array.`);

    playlistExternalTracks?.forEach((track, idx) =>
      console.log(`Track ${idx}: ${JSON.stringify(track)}\n\n`)
    );

    return playlistExternalTracks;
  } catch (err) {
    console.log(
      `An error occured while creating external tracks from youtube playlist: ${err}`
    );
  }
}
