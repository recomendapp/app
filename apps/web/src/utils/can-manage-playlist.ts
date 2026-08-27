import { Playlist } from '@libs/api-js';

// Matches the gating already used for the "manage members"/"edit playlist"
// context menu items (ContextMenuPlaylist) — editors/viewers/non-members
// should never reach a playlist's management modals, whether they got there
// by clicking a menu item or by a direct/deep-linked URL.
export const canManagePlaylist = (role: Playlist['role']) => role === 'owner' || role === 'admin';
