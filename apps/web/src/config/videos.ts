export interface VideoFeaturePreview {
  poster: { src: string; alt: string };
  sources: { src: string; type: string }[];
}

export const Videos = {
  welcome: {
    features: {
      tracking: {
        poster: {
          src: '/assets/images/welcome/features/tracking.jpg',
          alt: 'tracking feature preview',
        },
        sources: [
          { src: '/assets/videos/welcome/features/tracking.webm', type: 'video/webm' },
          { src: '/assets/videos/welcome/features/tracking.mp4', type: 'video/mp4' },
        ],
      },
      recos: {
        poster: { src: '/assets/images/welcome/features/recos.jpg', alt: 'recos feature preview' },
        sources: [
          { src: '/assets/videos/welcome/features/recos.webm', type: 'video/webm' },
          { src: '/assets/videos/welcome/features/recos.mp4', type: 'video/mp4' },
        ],
      },
      playlists: {
        poster: {
          src: '/assets/images/welcome/features/playlists.jpg',
          alt: 'playlists feature preview',
        },
        sources: [
          { src: '/assets/videos/welcome/features/playlists.webm', type: 'video/webm' },
          { src: '/assets/videos/welcome/features/playlists.mp4', type: 'video/mp4' },
        ],
      },
      feed: {
        poster: { src: '/assets/images/welcome/features/feed.jpg', alt: 'feed feature preview' },
        sources: [
          { src: '/assets/videos/welcome/features/feed.webm', type: 'video/webm' },
          { src: '/assets/videos/welcome/features/feed.mp4', type: 'video/mp4' },
        ],
      },
      watchlist: {
        poster: {
          src: '/assets/images/welcome/features/watchlist.jpg',
          alt: 'watchlist feature preview',
        },
        sources: [
          { src: '/assets/videos/welcome/features/watchlist.webm', type: 'video/webm' },
          { src: '/assets/videos/welcome/features/watchlist.mp4', type: 'video/mp4' },
        ],
      },
    } as Record<string, VideoFeaturePreview>,
  },
};
