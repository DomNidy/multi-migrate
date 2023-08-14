"use client";
import { Check, ChevronsUpDown } from "lucide-react";
import spotifyIcon from "@/public/spotify-icon.svg";
import youtubeIcon from "@/public/youtube-icon.svg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dispatch, SetStateAction, useState } from "react";
import { Platforms } from "@/definitions/Enums";
import Image from "next/image";

// Used for drop down select items
type PlaylistSelectItem = {
  name: string;
  playlistID: string;
  image_url: string;
  platform: Platforms;
  playlist_url: string | undefined;
};

export function SelectDestinationCombobox({
  playlists,
  updateSelectedPlaylist,
}: {
  updateSelectedPlaylist: Dispatch<
    SetStateAction<PlaylistSelectItem | undefined>
  >;
  playlists: PlaylistSelectItem[];
}) {
  const [open, setOpen] = useState<true | false>(false);
  const [value, setValue] = useState<string>("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? playlists.find((playlist) => playlist.playlistID === value)?.name
            : "Select playlist..."}

          <ChevronsUpDown className="ml-2  h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search destination playlist..." />
          <CommandEmpty>No playlist found...</CommandEmpty>
          <CommandGroup>
            {playlists.map((playlist) => (
              <CommandItem
                key={playlist.playlistID}
                onSelect={(currentValue) => {
                  console.log(currentValue);
                  updateSelectedPlaylist(playlist);
                  setValue(playlist.playlistID);
                  setOpen(false);
                }}
              >
                {playlist.platform == Platforms.SPOTIFY ? (
                  <Image src={spotifyIcon} width={24} height={24} alt="" />
                ) : (
                  <Image src={youtubeIcon} width={24} height={24} alt="" />
                )}

                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === playlist.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {playlist.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
