export const USER_RULES = {
  USERNAME: {
    MIN: 3,
    MAX: 15,
    REGEX: /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{2,14}$/,
    normalization: (username: string) => username.trim().toLowerCase(),
  },
  NAME: {
    MIN: 1,
    MAX: 30,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  BIO: {
    MAX: 150,
    REGEX: /^(?!\s*$)(?!.*\n\s*\n).{1,150}$/, 
  }
};

export const PLAYLIST_RULES = {
  TITLE: {
    MIN: 1,
    MAX: 50,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  DESCRIPTION: {
    MIN: 1,
    MAX: 300,
    REGEX: /^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/, 
  }
}

export const REVIEW_RULES = {
  TITLE: {
    MIN: 1,
    MAX: 50,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  BODY: {
    MIN: 13,
    MAX: 50000,
    REGEX: /^<html>[\s\S]*<\/html>$/,
  }
}