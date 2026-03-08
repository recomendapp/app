import { profile, user } from "../schemas";

export const USER_COMPACT_SELECT = {
  id: user.id,
  name: user.name,
  username: user.username,
  avatar: user.image,
  isPremium: profile.isPremium,
};