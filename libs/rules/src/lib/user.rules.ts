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
    REGEX: /^(?!\s*$)(?!.*\n\s*\n)[\s\S]{1,150}$/,
  },
  PASSWORD: {
    MIN: 8,
  },
};
