import axios from "axios";
import { gql } from "graphql-tag";
import { print } from "graphql";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RefreshTokenSuccess, SpotifyArtist } from "./types";

const getRefreshToken = gql`
  query {
    getRefreshToken {
      refreshToken
    }
  }
`;

const upsertArtists = gql`
  mutation upsertArtists($input: UpsertArtistsInput) {
    upsertArtists(input: $input) {
      success
    }
  }
`;

exports.handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { data }: { data: RefreshTokenSuccess } = await axios({
    url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
    method: "POST",
    headers: {
      Authorization: "123546",
    },
    data: {
      query: print(getRefreshToken),
    },
  });

  if (data?.errors) throw new Error(data.errors[0].message);

  const token = data.data?.getRefreshToken.refreshToken;

  const { data: spotifyData } = await axios({
    url: "https://api.spotify.com/v1/me/top/artists?time_range=short_term",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const mappedArtists = spotifyData.items.map((a: SpotifyArtist) => {
    const artist = { 
      id: a.id, 
      name: a.name, 
      link: a.href, 
      genres: a.genres, 
      image: {
        height: a.images[0].height,
        width: a.images[0].width,
        link: a.images[0].url
      }, 
      popularity: a.popularity 
    }
    return artist
  });

  await axios({
      url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
      method: "POST",
      headers: {
        Authorization: "123546",
      },
      data: {
        query: print(upsertArtists),
        variables: {
          input: {
            artists: mappedArtists
          },
        },
      },
  });

  return {
    statusCode: 200,
    body: "success",
  };
};
