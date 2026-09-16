export const REVIEW_RULES = {
  TITLE: {
    MIN: 1,
    // Was 50 in API validation, 100 in the DB check constraint. Unified on the
    // DB value (widening the API rule) to avoid rejecting rows the DB already accepts.
    MAX: 100,
    REGEX: /^[a-zA-Z0-9\s\S]*$/,
  },
  BODY: {
    MIN: 1,
    MAX: 50000,
  },
};
