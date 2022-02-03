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

const upsertArtist = gql`
  mutation upsertArtist($input: ArtistInput!) {
    upsertArtist(input: $input) {
      _id
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

  spotifyData.items.forEach(async (d: SpotifyArtist) => {
    await axios({
      url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
      method: "POST",
      headers: {
        Authorization: "123546",
      },
      data: {
        query: print(upsertArtist),
        variables: {
          input: {
            id: d.id,
            name: d.name,
            link: d.href,
            image: {
              height: d.images[0].height,
              width: d.images[0].width,
              link: d.images[0].url,
            },
            genres: [...d.genres],
          },
        },
      },
    });
  });

  return {
    statusCode: 200,
    body: "success",
  };
};
