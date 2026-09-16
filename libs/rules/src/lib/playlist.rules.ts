export const PLAYLIST_RULES = {
  TITLE: {
    MIN: 1,
    MAX: 100,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  DESCRIPTION: {
    MIN: 1,
    MAX: 300,
    REGEX: /^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/,
  },
};

export const PLAYLIST_ITEM_RULES = {
  COMMENT: {
    MAX: 180,
  },
};
