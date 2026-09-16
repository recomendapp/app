export const WATCHED_DATE_RULES = {
  COMMENT: {
    MIN: 1,
    MAX: 180,
    REGEX: /^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/,
  },
};
