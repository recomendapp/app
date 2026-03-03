export type PrefixRegistry<Prefix extends string, T> = {
  [K in keyof T as `${Prefix}:${K & string}`]: T[K];
};