export type RefreshTokenSuccess =  {
    data?: {
      getRefreshToken: {
        refreshToken: string
      }
    },
    errors?: any[]
}

type ImageObject = {
  height?: number | undefined;
  url: string;
  width?: number | undefined;
}

type ExternalUrlObject = {
  spotify: string;
}

type FollowersObject = {
  href: null;
  total: number;
}

export type SpotifyArtist = {
  external_urls: ExternalUrlObject,
  followers: FollowersObject,
  genres: string[],
  href: string,
  id: string,
  images: ImageObject[]
  name: string,
  popularity: number,
  type: "artist" | "playlist" | "album" | "show" | "episode",
  uri: string
}