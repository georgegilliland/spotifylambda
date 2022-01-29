const axios = require("axios");
const gql = require("graphql-tag");
const graphql = require("graphql");
const { print } = graphql;
require('dotenv').config()

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

exports.handler = async (event) => {
  const { data } = await axios({
    url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
    method: "POST",
    headers: {
      Authorization: process.env.key,
    },
    data: {
      query: print(getRefreshToken),
    },
  });

  if (data.errors) throw new Error(data.errors[0].message);

  const token = data.data.getRefreshToken.refreshToken;

  const { data: spotifyData } = await axios({
    url: "https://api.spotify.com/v1/me/top/artists?time_range=short_term",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log(spotifyData)
  spotifyData.items.forEach(async (d) => {
     await axios({
      url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
      method: "POST",
      headers: {
        Authorization: process.env.key,
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
};
