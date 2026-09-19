import {
  canEditPlaylist,
  canEditPlaylistItem,
  ROLES_CAN_EDIT,
  ROLES_CAN_EDIT_PLAYLIST,
} from './playlists';

describe('canEditPlaylistItem', () => {
  it('allows editor, admin and owner', () => {
    for (const role of ROLES_CAN_EDIT) {
      expect(canEditPlaylistItem(role)).toBe(true);
    }
  });

  it('rejects viewer', () => {
    expect(canEditPlaylistItem('viewer' as any)).toBe(false);
  });
});

describe('canEditPlaylist', () => {
  it('allows only admin and owner', () => {
    for (const role of ROLES_CAN_EDIT_PLAYLIST) {
      expect(canEditPlaylist(role)).toBe(true);
    }
  });

  it('rejects editor and viewer', () => {
    expect(canEditPlaylist('editor' as any)).toBe(false);
    expect(canEditPlaylist('viewer' as any)).toBe(false);
  });
});
