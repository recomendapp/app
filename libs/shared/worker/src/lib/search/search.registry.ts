import { PrefixRegistry } from "../utils";
import { SyncPlaylistDto, SyncUserDto } from "./search.dto";

export const SEARCH_QUEUE = 'search_queue';
export const SEARCH_PATH = 'search';

type BaseSearchRegistry = {
    'sync-user': SyncUserDto;
    'sync-playlist': SyncPlaylistDto;
};

export type SearchRegistry = PrefixRegistry<typeof SEARCH_PATH, BaseSearchRegistry>;