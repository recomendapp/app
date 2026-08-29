const app = {
  name: 'Recomend',
  webDomain: process.env.EXPO_PUBLIC_WEB_APP!,
  features: {
    playlist_collaborators: 'playlist_collaborators',
    feed_cast_crew: 'feed_cast_crew',
    custom_share_image: 'custom_share_image',
    playlist_duplicate: 'playlist_duplicate',
  } as const,
};

export default app;
