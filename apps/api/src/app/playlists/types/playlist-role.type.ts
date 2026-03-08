import { playlistMemberRoleEnum } from "@libs/db/schemas";

export type PlaylistRole = 'owner' | typeof playlistMemberRoleEnum.enumValues[number];
