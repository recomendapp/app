export const REVIEW_RULES = {
  TITLE: {
    MIN: 1,
    MAX: 100,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  BODY: {
    MIN: 1,
    MAX: 50000,
  },
};
