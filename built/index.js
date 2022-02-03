"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const graphql_tag_1 = require("graphql-tag");
const graphql_1 = require("graphql");
const getRefreshToken = (0, graphql_tag_1.gql) `
  query {
    getRefreshToken {
      refreshToken
    }
  }
`;
const upsertArtist = (0, graphql_tag_1.gql) `
  mutation upsertArtist($input: ArtistInput!) {
    upsertArtist(input: $input) {
      _id
    }
  }
`;
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { data } = yield (0, axios_1.default)({
        url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
        method: "POST",
        headers: {
            Authorization: "123546",
        },
        data: {
            query: (0, graphql_1.print)(getRefreshToken),
        },
    });
    if (data === null || data === void 0 ? void 0 : data.errors)
        throw new Error(data.errors[0].message);
    const token = (_a = data.data) === null || _a === void 0 ? void 0 : _a.getRefreshToken.refreshToken;
    const { data: spotifyData } = yield (0, axios_1.default)({
        url: "https://api.spotify.com/v1/me/top/artists?time_range=short_term",
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    spotifyData.items.forEach((d) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, axios_1.default)({
            url: "https://thejabronispotifydatapipeline.herokuapp.com/api",
            method: "POST",
            headers: {
                Authorization: "123546",
            },
            data: {
                query: (0, graphql_1.print)(upsertArtist),
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
    }));
    return {
        statusCode: 200,
        body: "success",
    };
});
