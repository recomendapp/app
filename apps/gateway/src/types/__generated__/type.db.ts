export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      explore: {
        Row: {
          id: number;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      explore_items: {
        Row: {
          explore_id: number;
          id: number;
          location: unknown;
          movie_id: number;
        };
        Insert: {
          explore_id: number;
          id?: number;
          location: unknown;
          movie_id: number;
        };
        Update: {
          explore_id?: number;
          id?: number;
          location?: unknown;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'explore_items_explore_id_fkey';
            columns: ['explore_id'];
            isOneToOne: false;
            referencedRelation: 'explore';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'explore_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'explore_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'explore_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      feed: {
        Row: {
          activity_id: number;
          activity_type: Database['public']['Enums']['feed_type'];
          created_at: string;
          id: number;
          user_id: string;
        };
        Insert: {
          activity_id: number;
          activity_type: Database['public']['Enums']['feed_type'];
          created_at?: string;
          id?: number;
          user_id: string;
        };
        Update: {
          activity_id?: number;
          activity_type?: Database['public']['Enums']['feed_type'];
          created_at?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feed_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feed_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      media_movie_stats: {
        Row: {
          id: number;
          likes_count: number;
          popularity: number | null;
          recos_count: number;
          review_count: number;
          vote_average: number | null;
          vote_count: number;
          watch_count: number;
          watchlist_count: number;
        };
        Insert: {
          id: number;
          likes_count?: number;
          popularity?: number | null;
          recos_count?: number;
          review_count?: number;
          vote_average?: number | null;
          vote_count?: number;
          watch_count?: number;
          watchlist_count?: number;
        };
        Update: {
          id?: number;
          likes_count?: number;
          popularity?: number | null;
          recos_count?: number;
          review_count?: number;
          vote_average?: number | null;
          vote_count?: number;
          watch_count?: number;
          watchlist_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'media_movie_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'media_movie_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'media_movie_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_stats: {
        Row: {
          id: number;
          likes_count: number;
          popularity: number | null;
          recos_count: number;
          review_count: number;
          vote_average: number | null;
          vote_count: number;
          watch_count: number;
          watchlist_count: number;
        };
        Insert: {
          id: number;
          likes_count?: number;
          popularity?: number | null;
          recos_count?: number;
          review_count?: number;
          vote_average?: number | null;
          vote_count?: number;
          watch_count?: number;
          watchlist_count?: number;
        };
        Update: {
          id?: number;
          likes_count?: number;
          popularity?: number | null;
          recos_count?: number;
          review_count?: number;
          vote_average?: number | null;
          vote_count?: number;
          watch_count?: number;
          watchlist_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'media_tv_series_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'media_tv_series_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'media_tv_series_stats_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      playlist_guests: {
        Row: {
          created_at: string;
          edit: boolean;
          id: number;
          playlist_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          edit?: boolean;
          id?: number;
          playlist_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          edit?: boolean;
          id?: number;
          playlist_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlist_guests_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_guests_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_guests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_guests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      playlist_items_movie: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          movie_id: number;
          playlist_id: number;
          rank: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id: number;
          playlist_id: number;
          rank: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id?: number;
          playlist_id?: number;
          rank?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlist_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      playlist_items_tv_series: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          playlist_id: number;
          rank: number;
          tv_series_id: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          playlist_id: number;
          rank: number;
          tv_series_id: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          playlist_id?: number;
          rank?: number;
          tv_series_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlist_items_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_items_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      playlists: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          items_count: number;
          likes_count: number;
          poster_url: string | null;
          private: boolean;
          saved_count: number;
          title: string;
          type: Database['public']['Enums']['playlists_type'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          items_count?: number;
          likes_count?: number;
          poster_url?: string | null;
          private?: boolean;
          saved_count?: number;
          title: string;
          type: Database['public']['Enums']['playlists_type'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          items_count?: number;
          likes_count?: number;
          poster_url?: string | null;
          private?: boolean;
          saved_count?: number;
          title?: string;
          type?: Database['public']['Enums']['playlists_type'];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      playlists_featured: {
        Row: {
          created_at: string;
          id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
        };
        Update: {
          created_at?: string;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_featured_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_featured_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
        ];
      };
      playlists_likes: {
        Row: {
          created_at: string;
          id: number;
          playlist_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          playlist_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          playlist_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_likes_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_likes_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      playlists_saved: {
        Row: {
          created_at: string;
          id: number;
          playlist_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          playlist_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          playlist_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_saved_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_saved_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists_friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_saved_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_saved_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          environment: string;
          expires_at: string | null;
          id: string;
          original_transaction_id: string;
          product_id: string;
          purchased_at: string;
          status: string;
          store: string;
          transaction_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          environment: string;
          expires_at?: string | null;
          id?: string;
          original_transaction_id: string;
          product_id: string;
          purchased_at: string;
          status: string;
          store: string;
          transaction_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          environment?: string;
          expires_at?: string | null;
          id?: string;
          original_transaction_id?: string;
          product_id?: string;
          purchased_at?: string;
          status?: string;
          store?: string;
          transaction_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      sync_logs: {
        Row: {
          created_at: string;
          date: string;
          id: number;
          status: Database['public']['Enums']['sync_logs_status'];
          type: Database['public']['Enums']['sync_logs_type'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id?: number;
          status?: Database['public']['Enums']['sync_logs_status'];
          type: Database['public']['Enums']['sync_logs_type'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: number;
          status?: Database['public']['Enums']['sync_logs_status'];
          type?: Database['public']['Enums']['sync_logs_type'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tmdb_collection: {
        Row: {
          id: number;
          name: string | null;
        };
        Insert: {
          id?: number;
          name?: string | null;
        };
        Update: {
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      tmdb_collection_image: {
        Row: {
          aspect_ratio: number | null;
          collection: number;
          file_path: string;
          height: number | null;
          id: number;
          iso_639_1: string | null;
          type: Database['public']['Enums']['image_type'];
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Insert: {
          aspect_ratio?: number | null;
          collection: number;
          file_path: string;
          height?: number | null;
          id?: number;
          iso_639_1?: string | null;
          type: Database['public']['Enums']['image_type'];
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Update: {
          aspect_ratio?: number | null;
          collection?: number;
          file_path?: string;
          height?: number | null;
          id?: number;
          iso_639_1?: string | null;
          type?: Database['public']['Enums']['image_type'];
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_collection_image_collection_fkey';
            columns: ['collection'];
            isOneToOne: false;
            referencedRelation: 'media_collection';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_collection_image_collection_fkey';
            columns: ['collection'];
            isOneToOne: false;
            referencedRelation: 'tmdb_collection';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_collection_translation: {
        Row: {
          collection: number;
          homepage: string | null;
          id: number;
          iso_3166_1: string;
          iso_639_1: string;
          overview: string | null;
          title: string | null;
        };
        Insert: {
          collection: number;
          homepage?: string | null;
          id?: number;
          iso_3166_1: string;
          iso_639_1: string;
          overview?: string | null;
          title?: string | null;
        };
        Update: {
          collection?: number;
          homepage?: string | null;
          id?: number;
          iso_3166_1?: string;
          iso_639_1?: string;
          overview?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_collection_translation_collection_fkey';
            columns: ['collection'];
            isOneToOne: false;
            referencedRelation: 'media_collection';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_collection_translation_collection_fkey';
            columns: ['collection'];
            isOneToOne: false;
            referencedRelation: 'tmdb_collection';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_company: {
        Row: {
          description: string | null;
          headquarters: string | null;
          homepage: string | null;
          id: number;
          name: string | null;
          origin_country: string | null;
          parent_company: number | null;
        };
        Insert: {
          description?: string | null;
          headquarters?: string | null;
          homepage?: string | null;
          id?: number;
          name?: string | null;
          origin_country?: string | null;
          parent_company?: number | null;
        };
        Update: {
          description?: string | null;
          headquarters?: string | null;
          homepage?: string | null;
          id?: number;
          name?: string | null;
          origin_country?: string | null;
          parent_company?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_company_parent_company_fkey';
            columns: ['parent_company'];
            isOneToOne: false;
            referencedRelation: 'media_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_company_parent_company_fkey';
            columns: ['parent_company'];
            isOneToOne: false;
            referencedRelation: 'tmdb_company';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_company_alternative_name: {
        Row: {
          company: number;
          id: number;
          name: string;
        };
        Insert: {
          company: number;
          id?: number;
          name: string;
        };
        Update: {
          company?: number;
          id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_company_alternative_name_company_fkey';
            columns: ['company'];
            isOneToOne: false;
            referencedRelation: 'media_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_company_alternative_name_company_fkey';
            columns: ['company'];
            isOneToOne: false;
            referencedRelation: 'tmdb_company';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_company_image: {
        Row: {
          aspect_ratio: number | null;
          company: number;
          file_path: string;
          file_type: string;
          height: number | null;
          id: string;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Insert: {
          aspect_ratio?: number | null;
          company: number;
          file_path: string;
          file_type: string;
          height?: number | null;
          id: string;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Update: {
          aspect_ratio?: number | null;
          company?: number;
          file_path?: string;
          file_type?: string;
          height?: number | null;
          id?: string;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_company_image_company_fkey';
            columns: ['company'];
            isOneToOne: false;
            referencedRelation: 'media_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_company_image_company_fkey';
            columns: ['company'];
            isOneToOne: false;
            referencedRelation: 'tmdb_company';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_country: {
        Row: {
          iso_3166_1: string;
        };
        Insert: {
          iso_3166_1: string;
        };
        Update: {
          iso_3166_1?: string;
        };
        Relationships: [];
      };
      tmdb_department: {
        Row: {
          id: number;
        };
        Insert: {
          id?: number;
        };
        Update: {
          id?: number;
        };
        Relationships: [];
      };
      tmdb_department_translation: {
        Row: {
          department: string;
          id: number;
          language: Database['public']['Enums']['language_app'];
        };
        Insert: {
          department: string;
          id?: number;
          language: Database['public']['Enums']['language_app'];
        };
        Update: {
          department?: string;
          id?: number;
          language?: Database['public']['Enums']['language_app'];
        };
        Relationships: [];
      };
      tmdb_gender: {
        Row: {
          id: number;
        };
        Insert: {
          id?: number;
        };
        Update: {
          id?: number;
        };
        Relationships: [];
      };
      tmdb_genre: {
        Row: {
          id: number;
        };
        Insert: {
          id?: number;
        };
        Update: {
          id?: number;
        };
        Relationships: [];
      };
      tmdb_genre_translation: {
        Row: {
          genre: number;
          id: number;
          language: string;
          name: string;
        };
        Insert: {
          genre: number;
          id?: number;
          language: string;
          name: string;
        };
        Update: {
          genre?: number;
          id?: number;
          language?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_genre_translation_genre_fkey';
            columns: ['genre'];
            isOneToOne: false;
            referencedRelation: 'media_genre';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_genre_translation_genre_fkey';
            columns: ['genre'];
            isOneToOne: false;
            referencedRelation: 'tmdb_genre';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_job: {
        Row: {
          id: number;
        };
        Insert: {
          id?: number;
        };
        Update: {
          id?: number;
        };
        Relationships: [];
      };
      tmdb_job_translation: {
        Row: {
          department_id: number;
          id: number;
          job: string;
          language: Database['public']['Enums']['language_app'];
        };
        Insert: {
          department_id: number;
          id?: number;
          job: string;
          language: Database['public']['Enums']['language_app'];
        };
        Update: {
          department_id?: number;
          id?: number;
          job?: string;
          language?: Database['public']['Enums']['language_app'];
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_job_translation_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_department';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_keyword: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      tmdb_language: {
        Row: {
          iso_639_1: string;
        };
        Insert: {
          iso_639_1: string;
        };
        Update: {
          iso_639_1?: string;
        };
        Relationships: [];
      };
      tmdb_movie: {
        Row: {
          adult: boolean;
          belongs_to_collection: number | null;
          budget: number;
          id: number;
          original_language: string | null;
          original_title: string | null;
          popularity: number;
          revenue: number;
          status: string | null;
          updated_at: string | null;
          vote_average: number;
          vote_count: number;
        };
        Insert: {
          adult?: boolean;
          belongs_to_collection?: number | null;
          budget?: number;
          id?: number;
          original_language?: string | null;
          original_title?: string | null;
          popularity?: number;
          revenue?: number;
          status?: string | null;
          updated_at?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Update: {
          adult?: boolean;
          belongs_to_collection?: number | null;
          budget?: number;
          id?: number;
          original_language?: string | null;
          original_title?: string | null;
          popularity?: number;
          revenue?: number;
          status?: string | null;
          updated_at?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_collection_fkey';
            columns: ['belongs_to_collection'];
            isOneToOne: false;
            referencedRelation: 'media_collection';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_collection_fkey';
            columns: ['belongs_to_collection'];
            isOneToOne: false;
            referencedRelation: 'tmdb_collection';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_alternative_titles: {
        Row: {
          id: number;
          iso_3166_1: string;
          movie_id: number;
          title: string;
          type: string | null;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          movie_id: number;
          title: string;
          type?: string | null;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          movie_id?: number;
          title?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_alternative_title_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_alternative_title_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_alternative_title_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_credits: {
        Row: {
          department: string;
          id: string;
          job: string;
          movie_id: number;
          person_id: number;
        };
        Insert: {
          department: string;
          id: string;
          job: string;
          movie_id: number;
          person_id: number;
        };
        Update: {
          department?: string;
          id?: string;
          job?: string;
          movie_id?: number;
          person_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_external_ids: {
        Row: {
          id: number;
          movie_id: number;
          source: string;
          value: string;
        };
        Insert: {
          id?: number;
          movie_id: number;
          source: string;
          value: string;
        };
        Update: {
          id?: number;
          movie_id?: number;
          source?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_external_ids_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_external_ids_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_external_ids_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_genres: {
        Row: {
          genre_id: number;
          id: number;
          movie_id: number;
        };
        Insert: {
          genre_id: number;
          id?: number;
          movie_id: number;
        };
        Update: {
          genre_id?: number;
          id?: number;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_genre_genre_id_fkey';
            columns: ['genre_id'];
            isOneToOne: false;
            referencedRelation: 'media_genre';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_genre_genre_id_fkey';
            columns: ['genre_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_genre';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_genre_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_genre_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_genre_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_images: {
        Row: {
          aspect_ratio: number;
          file_path: string;
          height: number;
          id: number;
          iso_639_1: string | null;
          movie_id: number;
          type: Database['public']['Enums']['image_type'];
          vote_average: number;
          vote_count: number;
          width: number;
        };
        Insert: {
          aspect_ratio?: number;
          file_path: string;
          height?: number;
          id?: number;
          iso_639_1?: string | null;
          movie_id: number;
          type: Database['public']['Enums']['image_type'];
          vote_average?: number;
          vote_count?: number;
          width?: number;
        };
        Update: {
          aspect_ratio?: number;
          file_path?: string;
          height?: number;
          id?: number;
          iso_639_1?: string | null;
          movie_id?: number;
          type?: Database['public']['Enums']['image_type'];
          vote_average?: number;
          vote_count?: number;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_keywords: {
        Row: {
          id: number;
          keyword_id: number;
          movie_id: number;
        };
        Insert: {
          id?: number;
          keyword_id: number;
          movie_id: number;
        };
        Update: {
          id?: number;
          keyword_id?: number;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_keyword_keyword_id_fkey';
            columns: ['keyword_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_keyword';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_keyword_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_keyword_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_keyword_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_origin_country: {
        Row: {
          id: number;
          iso_3166_1: string;
          movie_id: number;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          movie_id: number;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_origin_country_country_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_origin_country_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_origin_country_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_origin_country_movie_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_production_companies: {
        Row: {
          company_id: number;
          id: number;
          movie_id: number;
        };
        Insert: {
          company_id: number;
          id?: number;
          movie_id: number;
        };
        Update: {
          company_id?: number;
          id?: number;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_production_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'media_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_production_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_production_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_production_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_production_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_production_countries: {
        Row: {
          id: number;
          iso_3166_1: string;
          movie_id: number;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          movie_id: number;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_country_country_id_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_country_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_country_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_country_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_release_dates: {
        Row: {
          certification: string | null;
          descriptors: string[] | null;
          id: number;
          iso_3166_1: string;
          iso_639_1: string | null;
          movie_id: number;
          note: string | null;
          release_date: string;
          release_type: number;
        };
        Insert: {
          certification?: string | null;
          descriptors?: string[] | null;
          id?: number;
          iso_3166_1: string;
          iso_639_1?: string | null;
          movie_id: number;
          note?: string | null;
          release_date: string;
          release_type: number;
        };
        Update: {
          certification?: string | null;
          descriptors?: string[] | null;
          id?: number;
          iso_3166_1?: string;
          iso_639_1?: string | null;
          movie_id?: number;
          note?: string | null;
          release_date?: string;
          release_type?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_release_dates_iso_3166_1_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_release_dates_iso_639_1_fkey';
            columns: ['iso_639_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_language';
            referencedColumns: ['iso_639_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_release_dates_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_release_dates_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_release_dates_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_roles: {
        Row: {
          character: string | null;
          credit_id: string;
          order: number;
        };
        Insert: {
          character?: string | null;
          credit_id: string;
          order: number;
        };
        Update: {
          character?: string | null;
          credit_id?: string;
          order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_role_credit_id_fkey';
            columns: ['credit_id'];
            isOneToOne: true;
            referencedRelation: 'tmdb_movie_credits';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_role_credit_id_fkey';
            columns: ['credit_id'];
            isOneToOne: true;
            referencedRelation: 'tmdb_movie_credits_random';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_spoken_languages: {
        Row: {
          id: number;
          iso_639_1: string;
          movie_id: number;
        };
        Insert: {
          id?: number;
          iso_639_1: string;
          movie_id: number;
        };
        Update: {
          id?: number;
          iso_639_1?: string;
          movie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_language_language_id_fkey';
            columns: ['iso_639_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_language';
            referencedColumns: ['iso_639_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_language_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_language_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_language_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_translations: {
        Row: {
          homepage: string | null;
          id: number;
          iso_3166_1: string;
          iso_639_1: string;
          movie_id: number;
          overview: string | null;
          runtime: number;
          tagline: string | null;
          title: string | null;
        };
        Insert: {
          homepage?: string | null;
          id?: number;
          iso_3166_1: string;
          iso_639_1: string;
          movie_id: number;
          overview?: string | null;
          runtime?: number;
          tagline?: string | null;
          title?: string | null;
        };
        Update: {
          homepage?: string | null;
          id?: number;
          iso_3166_1?: string;
          iso_639_1?: string;
          movie_id?: number;
          overview?: string | null;
          runtime?: number;
          tagline?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_translation_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_translation_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_translation_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_movie_videos: {
        Row: {
          id: string;
          iso_3166_1: string | null;
          iso_639_1: string | null;
          key: string;
          movie_id: number;
          name: string | null;
          official: boolean;
          published_at: string;
          site: string;
          size: number | null;
          type: string | null;
        };
        Insert: {
          id: string;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          key: string;
          movie_id: number;
          name?: string | null;
          official: boolean;
          published_at: string;
          site: string;
          size?: number | null;
          type?: string | null;
        };
        Update: {
          id?: string;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          key?: string;
          movie_id?: number;
          name?: string | null;
          official?: boolean;
          published_at?: string;
          site?: string;
          size?: number | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_videos_iso_3166_1_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_movie_videos_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_videos_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_videos_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_network: {
        Row: {
          headquarters: string | null;
          homepage: string | null;
          id: number;
          name: string;
          origin_country: string | null;
        };
        Insert: {
          headquarters?: string | null;
          homepage?: string | null;
          id?: number;
          name: string;
          origin_country?: string | null;
        };
        Update: {
          headquarters?: string | null;
          homepage?: string | null;
          id?: number;
          name?: string;
          origin_country?: string | null;
        };
        Relationships: [];
      };
      tmdb_network_alternative_name: {
        Row: {
          id: number;
          name: string;
          network: number;
          type: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          network: number;
          type?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          network?: number;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_network_alternative_name_network_fkey';
            columns: ['network'];
            isOneToOne: false;
            referencedRelation: 'tmdb_network';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_network_image: {
        Row: {
          aspect_ratio: number | null;
          file_path: string;
          file_type: string;
          height: number | null;
          id: string;
          network: number;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Insert: {
          aspect_ratio?: number | null;
          file_path: string;
          file_type: string;
          height?: number | null;
          id: string;
          network: number;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Update: {
          aspect_ratio?: number | null;
          file_path?: string;
          file_type?: string;
          height?: number | null;
          id?: string;
          network?: number;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_network_image_network_fkey';
            columns: ['network'];
            isOneToOne: false;
            referencedRelation: 'tmdb_network';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person: {
        Row: {
          adult: boolean;
          birthday: string | null;
          deathday: string | null;
          gender: number | null;
          homepage: string | null;
          id: number;
          imdb_id: string | null;
          known_for_department: string | null;
          name: string | null;
          place_of_birth: string | null;
          popularity: number | null;
        };
        Insert: {
          adult?: boolean;
          birthday?: string | null;
          deathday?: string | null;
          gender?: number | null;
          homepage?: string | null;
          id?: number;
          imdb_id?: string | null;
          known_for_department?: string | null;
          name?: string | null;
          place_of_birth?: string | null;
          popularity?: number | null;
        };
        Update: {
          adult?: boolean;
          birthday?: string | null;
          deathday?: string | null;
          gender?: number | null;
          homepage?: string | null;
          id?: number;
          imdb_id?: string | null;
          known_for_department?: string | null;
          name?: string | null;
          place_of_birth?: string | null;
          popularity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_gender_fkey';
            columns: ['gender'];
            isOneToOne: false;
            referencedRelation: 'tmdb_gender';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person_also_known_as: {
        Row: {
          id: number;
          name: string;
          person: number;
        };
        Insert: {
          id?: number;
          name: string;
          person: number;
        };
        Update: {
          id?: number;
          name?: string;
          person?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_also_known_as_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_person_also_known_as_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person_external_id: {
        Row: {
          id: number;
          person: number;
          source: string;
          value: string;
        };
        Insert: {
          id?: number;
          person: number;
          source: string;
          value: string;
        };
        Update: {
          id?: number;
          person?: number;
          source?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_external_id_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_person_external_id_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person_image: {
        Row: {
          aspect_ratio: number | null;
          file_path: string;
          height: number | null;
          id: number;
          person: number;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Insert: {
          aspect_ratio?: number | null;
          file_path: string;
          height?: number | null;
          id?: number;
          person: number;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Update: {
          aspect_ratio?: number | null;
          file_path?: string;
          height?: number | null;
          id?: number;
          person?: number;
          vote_average?: number | null;
          vote_count?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_image_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_person_image_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person_translation: {
        Row: {
          biography: string | null;
          id: number;
          iso_3166_1: string | null;
          iso_639_1: string | null;
          person: number | null;
        };
        Insert: {
          biography?: string | null;
          id?: number;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          person?: number | null;
        };
        Update: {
          biography?: string | null;
          id?: number;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          person?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_translation_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_person_translation_person_fkey';
            columns: ['person'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series: {
        Row: {
          adult: boolean;
          first_air_date: string | null;
          id: number;
          in_production: boolean;
          last_air_date: string | null;
          number_of_episodes: number | null;
          number_of_seasons: number | null;
          original_language: string | null;
          original_name: string | null;
          popularity: number;
          status: string | null;
          type: string | null;
          vote_average: number;
          vote_count: number;
        };
        Insert: {
          adult?: boolean;
          first_air_date?: string | null;
          id?: number;
          in_production?: boolean;
          last_air_date?: string | null;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          original_language?: string | null;
          original_name?: string | null;
          popularity?: number;
          status?: string | null;
          type?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Update: {
          adult?: boolean;
          first_air_date?: string | null;
          id?: number;
          in_production?: boolean;
          last_air_date?: string | null;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          original_language?: string | null;
          original_name?: string | null;
          popularity?: number;
          status?: string | null;
          type?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Relationships: [];
      };
      tmdb_tv_series_alternative_titles: {
        Row: {
          id: number;
          iso_3166_1: string;
          serie_id: number;
          title: string;
          type: string | null;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          serie_id: number;
          title: string;
          type?: string | null;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          serie_id?: number;
          title?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_alternative_titles_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_alternative_titles_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_alternative_titles_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_content_ratings: {
        Row: {
          descriptors: string[] | null;
          id: number;
          iso_3166_1: string;
          rating: string;
          serie_id: number;
        };
        Insert: {
          descriptors?: string[] | null;
          id?: number;
          iso_3166_1: string;
          rating: string;
          serie_id: number;
        };
        Update: {
          descriptors?: string[] | null;
          id?: number;
          iso_3166_1?: string;
          rating?: string;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_content_ratings_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_content_ratings_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_content_ratings_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_credits: {
        Row: {
          department: string;
          id: string;
          job: string;
          person_id: number;
          serie_id: number;
        };
        Insert: {
          department: string;
          id: string;
          job: string;
          person_id: number;
          serie_id: number;
        };
        Update: {
          department?: string;
          id?: string;
          job?: string;
          person_id?: number;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_episodes: {
        Row: {
          air_date: string | null;
          episode_number: number;
          episode_type: string | null;
          id: number;
          name: string | null;
          overview: string | null;
          production_code: string | null;
          runtime: number | null;
          season_id: number;
          still_path: string | null;
          vote_average: number;
          vote_count: number;
        };
        Insert: {
          air_date?: string | null;
          episode_number: number;
          episode_type?: string | null;
          id?: number;
          name?: string | null;
          overview?: string | null;
          production_code?: string | null;
          runtime?: number | null;
          season_id: number;
          still_path?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Update: {
          air_date?: string | null;
          episode_number?: number;
          episode_type?: string | null;
          id?: number;
          name?: string | null;
          overview?: string | null;
          production_code?: string | null;
          runtime?: number | null;
          season_id?: number;
          still_path?: string | null;
          vote_average?: number;
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_episodes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_episodes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_episodes_credits: {
        Row: {
          credit_id: string;
          episode_id: number;
          id: number;
        };
        Insert: {
          credit_id: string;
          episode_id: number;
          id?: number;
        };
        Update: {
          credit_id?: string;
          episode_id?: number;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_episodes_credits_credit_id_fkey';
            columns: ['credit_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_credits';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_episodes_credits_episode_id_fkey';
            columns: ['episode_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_episodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_episodes_credits_episode_id_fkey';
            columns: ['episode_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_episodes';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_external_ids: {
        Row: {
          id: number;
          serie_id: number;
          source: string;
          value: string;
        };
        Insert: {
          id?: number;
          serie_id: number;
          source: string;
          value: string;
        };
        Update: {
          id?: number;
          serie_id?: number;
          source?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_external_ids_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_external_ids_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_external_ids_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_genres: {
        Row: {
          genre_id: number;
          id: number;
          serie_id: number;
        };
        Insert: {
          genre_id: number;
          id?: number;
          serie_id: number;
        };
        Update: {
          genre_id?: number;
          id?: number;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_genres_genre_id_fkey';
            columns: ['genre_id'];
            isOneToOne: false;
            referencedRelation: 'media_genre';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_genres_genre_id_fkey';
            columns: ['genre_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_genre';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_genres_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_genres_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_genres_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_images: {
        Row: {
          aspect_ratio: number;
          file_path: string;
          height: number;
          id: number;
          iso_639_1: string | null;
          serie_id: number;
          type: Database['public']['Enums']['image_type'];
          vote_average: number;
          vote_count: number;
          width: number;
        };
        Insert: {
          aspect_ratio?: number;
          file_path: string;
          height?: number;
          id?: number;
          iso_639_1?: string | null;
          serie_id: number;
          type: Database['public']['Enums']['image_type'];
          vote_average?: number;
          vote_count?: number;
          width?: number;
        };
        Update: {
          aspect_ratio?: number;
          file_path?: string;
          height?: number;
          id?: number;
          iso_639_1?: string | null;
          serie_id?: number;
          type?: Database['public']['Enums']['image_type'];
          vote_average?: number;
          vote_count?: number;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_keywords: {
        Row: {
          id: number;
          keyword_id: number;
          serie_id: number;
        };
        Insert: {
          id?: number;
          keyword_id: number;
          serie_id: number;
        };
        Update: {
          id?: number;
          keyword_id?: number;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_keywords_keyword_id_fkey';
            columns: ['keyword_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_keyword';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_keywords_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_keywords_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_keywords_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_languages: {
        Row: {
          id: number;
          iso_639_1: string;
          serie_id: number;
        };
        Insert: {
          id?: number;
          iso_639_1: string;
          serie_id: number;
        };
        Update: {
          id?: number;
          iso_639_1?: string;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_languages_iso_639_1_fkey';
            columns: ['iso_639_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_language';
            referencedColumns: ['iso_639_1'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_networks: {
        Row: {
          id: number;
          network_id: number;
          serie_id: number;
        };
        Insert: {
          id?: number;
          network_id: number;
          serie_id: number;
        };
        Update: {
          id?: number;
          network_id?: number;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_networks_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_network';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_networks_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_networks_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_networks_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_origin_country: {
        Row: {
          id: number;
          iso_3166_1: string;
          serie_id: number;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          serie_id: number;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_origin_country_iso_3166_1_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_origin_country_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_origin_country_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_origin_country_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_production_companies: {
        Row: {
          company_id: number;
          id: number;
          serie_id: number;
        };
        Insert: {
          company_id: number;
          id?: number;
          serie_id: number;
        };
        Update: {
          company_id?: number;
          id?: number;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_production_companies_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'media_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_companies_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_companies_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_companies_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_companies_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_production_countries: {
        Row: {
          id: number;
          iso_3166_1: string;
          serie_id: number;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          serie_id: number;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_production_countries_iso_3166_1_fkey';
            columns: ['iso_3166_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_country';
            referencedColumns: ['iso_3166_1'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_countries_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_countries_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_production_countries_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_roles: {
        Row: {
          character: string | null;
          credit_id: string;
          episode_count: number | null;
          order: number;
        };
        Insert: {
          character?: string | null;
          credit_id: string;
          episode_count?: number | null;
          order: number;
        };
        Update: {
          character?: string | null;
          credit_id?: string;
          episode_count?: number | null;
          order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_roles_credit_id_fkey';
            columns: ['credit_id'];
            isOneToOne: true;
            referencedRelation: 'tmdb_tv_series_credits';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_seasons: {
        Row: {
          id: number;
          poster_path: string | null;
          season_number: number;
          serie_id: number;
          vote_average: number;
          vote_count: number;
        };
        Insert: {
          id?: number;
          poster_path?: string | null;
          season_number: number;
          serie_id: number;
          vote_average: number;
          vote_count: number;
        };
        Update: {
          id?: number;
          poster_path?: string | null;
          season_number?: number;
          serie_id?: number;
          vote_average?: number;
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_seasons_credits: {
        Row: {
          credit_id: string;
          id: number;
          order: number | null;
          season_id: number;
        };
        Insert: {
          credit_id: string;
          id?: number;
          order?: number | null;
          season_id: number;
        };
        Update: {
          credit_id?: string;
          id?: number;
          order?: number | null;
          season_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_seasons_credits_credit_id_fkey';
            columns: ['credit_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_credits';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_credits_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_credits_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_seasons_translations: {
        Row: {
          id: number;
          iso_3166_1: string;
          iso_639_1: string;
          name: string | null;
          overview: string | null;
          season_id: number;
        };
        Insert: {
          id?: number;
          iso_3166_1: string;
          iso_639_1: string;
          name?: string | null;
          overview?: string | null;
          season_id: number;
        };
        Update: {
          id?: number;
          iso_3166_1?: string;
          iso_639_1?: string;
          name?: string | null;
          overview?: string | null;
          season_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_seasons_translations_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_translations_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_spoken_languages: {
        Row: {
          id: number;
          iso_639_1: string;
          serie_id: number;
        };
        Insert: {
          id?: number;
          iso_639_1: string;
          serie_id: number;
        };
        Update: {
          id?: number;
          iso_639_1?: string;
          serie_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_spoken_languages_iso_639_1_fkey';
            columns: ['iso_639_1'];
            isOneToOne: false;
            referencedRelation: 'tmdb_language';
            referencedColumns: ['iso_639_1'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_spoken_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_spoken_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_spoken_languages_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_translations: {
        Row: {
          homepage: string | null;
          id: number;
          iso_3166_1: string;
          iso_639_1: string;
          name: string | null;
          overview: string | null;
          serie_id: number;
          tagline: string | null;
        };
        Insert: {
          homepage?: string | null;
          id?: number;
          iso_3166_1: string;
          iso_639_1: string;
          name?: string | null;
          overview?: string | null;
          serie_id: number;
          tagline?: string | null;
        };
        Update: {
          homepage?: string | null;
          id?: number;
          iso_3166_1?: string;
          iso_639_1?: string;
          name?: string | null;
          overview?: string | null;
          serie_id?: number;
          tagline?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_serie_translations_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_serie_translations_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_serie_translations_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_tv_series_videos: {
        Row: {
          id: string;
          iso_3166_1: string | null;
          iso_639_1: string | null;
          key: string;
          name: string | null;
          official: boolean;
          published_at: string;
          serie_id: number;
          site: string;
          size: number | null;
          type: string | null;
        };
        Insert: {
          id: string;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          key: string;
          name?: string | null;
          official?: boolean;
          published_at: string;
          serie_id: number;
          site: string;
          size?: number | null;
          type?: string | null;
        };
        Update: {
          id?: string;
          iso_3166_1?: string | null;
          iso_639_1?: string | null;
          key?: string;
          name?: string | null;
          official?: boolean;
          published_at?: string;
          serie_id?: number;
          site?: string;
          size?: number | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_videos_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_videos_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_videos_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      ui_backgrounds: {
        Row: {
          id: string;
          media_id: number;
          media_type: Database['public']['Enums']['media_type'];
          url: string;
        };
        Insert: {
          id?: string;
          media_id: number;
          media_type: Database['public']['Enums']['media_type'];
          url: string;
        };
        Update: {
          id?: string;
          media_id?: number;
          media_type?: Database['public']['Enums']['media_type'];
          url?: string;
        };
        Relationships: [];
      };
      user: {
        Row: {
          avatar_url: string | null;
          background_url: string | null;
          bio: string | null;
          created_at: string;
          favorite_color: string | null;
          followers_count: number;
          following_count: number;
          full_name: string;
          id: string;
          language: string;
          premium: boolean;
          private: boolean;
          username: string;
          username_updated_at: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          background_url?: string | null;
          bio?: string | null;
          created_at?: string;
          favorite_color?: string | null;
          followers_count?: number;
          following_count?: number;
          full_name: string;
          id: string;
          language?: string;
          premium?: boolean;
          private?: boolean;
          username: string;
          username_updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          background_url?: string | null;
          bio?: string | null;
          created_at?: string;
          favorite_color?: string | null;
          followers_count?: number;
          following_count?: number;
          full_name?: string;
          id?: string;
          language?: string;
          premium?: boolean;
          private?: boolean;
          username?: string;
          username_updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      user_activities_movie: {
        Row: {
          created_at: string;
          id: number;
          is_liked: boolean;
          liked_at: string | null;
          movie_id: number;
          rated_at: string | null;
          rating: number | null;
          updated_at: string;
          user_id: string;
          watched_date: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_liked?: boolean;
          liked_at?: string | null;
          movie_id: number;
          rated_at?: string | null;
          rating?: number | null;
          updated_at?: string;
          user_id: string;
          watched_date?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_liked?: boolean;
          liked_at?: string | null;
          movie_id?: number;
          rated_at?: string | null;
          rating?: number | null;
          updated_at?: string;
          user_id?: string;
          watched_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities_tv_series: {
        Row: {
          created_at: string;
          id: number;
          is_liked: boolean;
          liked_at: string | null;
          rated_at: string | null;
          rating: number | null;
          tv_series_id: number;
          updated_at: string;
          user_id: string;
          watched_date: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_liked?: boolean;
          liked_at?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          tv_series_id: number;
          updated_at?: string;
          user_id: string;
          watched_date?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_liked?: boolean;
          liked_at?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          tv_series_id?: number;
          updated_at?: string;
          user_id?: string;
          watched_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_billing: {
        Row: {
          billing_address: Json | null;
          payment_method: Json | null;
          user_id: string;
        };
        Insert: {
          billing_address?: Json | null;
          payment_method?: Json | null;
          user_id: string;
        };
        Update: {
          billing_address?: Json | null;
          payment_method?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_billing_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_billing_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_deletion_requests: {
        Row: {
          delete_after: string;
          id: number;
          requested_at: string;
          user_id: string;
        };
        Insert: {
          delete_after?: string;
          id?: number;
          requested_at?: string;
          user_id: string;
        };
        Update: {
          delete_after?: string;
          id?: number;
          requested_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_deletion_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_deletion_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follower: {
        Row: {
          created_at: string;
          followee_id: string;
          id: number;
          is_pending: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          id?: number;
          is_pending?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          id?: number;
          is_pending?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_follower_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follower_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follower_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follower_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_friend: {
        Row: {
          created_at: string;
          friend_id: string;
          id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          friend_id: string;
          id?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_friend_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_friend_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_friend_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_friend_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_notification_tokens: {
        Row: {
          created_at: string;
          device_type: Database['public']['Enums']['notifications_device_type'];
          id: number;
          provider: Database['public']['Enums']['notifications_provider'];
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_type: Database['public']['Enums']['notifications_device_type'];
          id?: number;
          provider: Database['public']['Enums']['notifications_provider'];
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_type?: Database['public']['Enums']['notifications_device_type'];
          id?: number;
          provider?: Database['public']['Enums']['notifications_provider'];
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_notification_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_notification_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_person_follower: {
        Row: {
          created_at: string;
          id: number;
          person_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          person_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          person_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_person_follower_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_person_follower_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_person_follower_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_person_follower_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_movie: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          movie_id: number;
          sender_id: string;
          status: Database['public']['Enums']['reco_status'];
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id: number;
          sender_id: string;
          status?: Database['public']['Enums']['reco_status'];
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id?: number;
          sender_id?: string;
          status?: Database['public']['Enums']['reco_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_tv_series: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          sender_id: string;
          status: Database['public']['Enums']['reco_status'];
          tv_series_id: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          sender_id: string;
          status?: Database['public']['Enums']['reco_status'];
          tv_series_id: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          sender_id?: string;
          status?: Database['public']['Enums']['reco_status'];
          tv_series_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_tv_series_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_review_movie_likes: {
        Row: {
          created_at: string;
          id: number;
          review_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          review_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          review_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_review_movie_likes_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'user_reviews_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_review_movie_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_review_movie_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_review_tv_series_likes: {
        Row: {
          created_at: string;
          id: number;
          review_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          review_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          review_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_review_tv_series_likes_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'user_reviews_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_review_tv_series_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_review_tv_series_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_reviews_movie: {
        Row: {
          body: string;
          comments_count: number;
          created_at: string;
          id: number;
          likes_count: number;
          title: string | null;
          updated_at: string;
          views_count: number;
        };
        Insert: {
          body: string;
          comments_count?: number;
          created_at?: string;
          id?: number;
          likes_count?: number;
          title?: string | null;
          updated_at?: string;
          views_count?: number;
        };
        Update: {
          body?: string;
          comments_count?: number;
          created_at?: string;
          id?: number;
          likes_count?: number;
          title?: string | null;
          updated_at?: string;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_reviews_movie_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'user_activities_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_reviews_movie_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'user_activities_movie_follower';
            referencedColumns: ['id'];
          },
        ];
      };
      user_reviews_tv_series: {
        Row: {
          body: string;
          comments_count: number;
          created_at: string;
          id: number;
          likes_count: number;
          title: string | null;
          updated_at: string;
          views_count: number;
        };
        Insert: {
          body: string;
          comments_count?: number;
          created_at?: string;
          id?: number;
          likes_count?: number;
          title?: string | null;
          updated_at?: string;
          views_count?: number;
        };
        Update: {
          body?: string;
          comments_count?: number;
          created_at?: string;
          id?: number;
          likes_count?: number;
          title?: string | null;
          updated_at?: string;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_reviews_tv_series_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'user_activities_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_reviews_tv_series_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'user_activities_tv_series_follower';
            referencedColumns: ['id'];
          },
        ];
      };
      user_watchlists_movie: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          movie_id: number;
          status: Database['public']['Enums']['watchlist_status'];
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id: number;
          status?: Database['public']['Enums']['watchlist_status'];
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          movie_id?: number;
          status?: Database['public']['Enums']['watchlist_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_watchlists_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_watchlists_tv_series: {
        Row: {
          comment: string | null;
          created_at: string;
          id: number;
          status: Database['public']['Enums']['watchlist_status'];
          tv_series_id: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          status?: Database['public']['Enums']['watchlist_status'];
          tv_series_id: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: number;
          status?: Database['public']['Enums']['watchlist_status'];
          tv_series_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_watchlists_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_watchlists_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      media_collection: {
        Row: {
          backdrop_path: string | null;
          homepage: string | null;
          id: number | null;
          name: string | null;
          overview: string | null;
          poster_path: string | null;
        };
        Relationships: [];
      };
      media_combined_credits: {
        Row: {
          credit_id: string | null;
          department: string | null;
          job: string | null;
          media_id: number | null;
          media_type: Database['public']['Enums']['media_type'] | null;
          person_id: number | null;
          ref_date: string | null;
        };
        Relationships: [];
      };
      media_company: {
        Row: {
          alternative_names: Json | null;
          description: string | null;
          headquarters: string | null;
          homepage: string | null;
          id: number | null;
          logo_path: string | null;
          name: string | null;
          origin_country: string | null;
          parent_company: Json | null;
        };
        Relationships: [];
      };
      media_genre: {
        Row: {
          id: number | null;
          name: string | null;
        };
        Relationships: [];
      };
      media_movie: {
        Row: {
          backdrop_path: string | null;
          backdrop_url: string | null;
          budget: number | null;
          directors: Json[] | null;
          follower_avg_rating: number | null;
          genres: Json[] | null;
          homepage: string | null;
          id: number | null;
          original_language: string | null;
          original_title: string | null;
          overview: string | null;
          popularity: number | null;
          poster_path: string | null;
          poster_url: string | null;
          release_date: string | null;
          revenue: number | null;
          runtime: number | null;
          slug: string | null;
          status: string | null;
          title: string | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [];
      };
      media_movie_aggregate_credits: {
        Row: {
          credits: Json | null;
          movie_id: number | null;
          person_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      media_movie_backdrops: {
        Row: {
          aspect_ratio: number | null;
          backdrop_url: string | null;
          file_path: string | null;
          height: number | null;
          id: number | null;
          iso_639_1: string | null;
          movie_id: number | null;
          type: Database['public']['Enums']['image_type'] | null;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      media_movie_casting: {
        Row: {
          credits: Json | null;
          movie_id: number | null;
          order: number | null;
          person_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      media_movie_full: {
        Row: {
          backdrop_path: string | null;
          backdrop_url: string | null;
          budget: number | null;
          directors: Json[] | null;
          follower_avg_rating: number | null;
          genres: Json[] | null;
          homepage: string | null;
          id: number | null;
          original_language: string | null;
          original_title: string | null;
          overview: string | null;
          popularity: number | null;
          poster_path: string | null;
          poster_url: string | null;
          release_date: string | null;
          revenue: number | null;
          runtime: number | null;
          slug: string | null;
          status: string | null;
          title: string | null;
          trailers: Json | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [];
      };
      media_movie_posters: {
        Row: {
          aspect_ratio: number | null;
          file_path: string | null;
          height: number | null;
          id: number | null;
          iso_639_1: string | null;
          movie_id: number | null;
          poster_url: string | null;
          type: Database['public']['Enums']['image_type'] | null;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_images_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      media_person: {
        Row: {
          biography: string | null;
          birthday: string | null;
          deathday: string | null;
          gender: number | null;
          homepage: string | null;
          id: number | null;
          imdb_id: string | null;
          known_for_department: string | null;
          name: string | null;
          place_of_birth: string | null;
          popularity: number | null;
          profile_path: string | null;
          profile_url: string | null;
          slug: string | null;
          url: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_person_gender_fkey';
            columns: ['gender'];
            isOneToOne: false;
            referencedRelation: 'tmdb_gender';
            referencedColumns: ['id'];
          },
        ];
      };
      media_person_jobs: {
        Row: {
          department: string | null;
          jobs: string[] | null;
          person_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series: {
        Row: {
          backdrop_path: string | null;
          backdrop_url: string | null;
          created_by: Json[] | null;
          first_air_date: string | null;
          follower_avg_rating: number | null;
          genres: Json[] | null;
          id: number | null;
          in_production: boolean | null;
          last_air_date: string | null;
          name: string | null;
          number_of_episodes: number | null;
          number_of_seasons: number | null;
          original_language: string | null;
          original_name: string | null;
          overview: string | null;
          popularity: number | null;
          poster_path: string | null;
          poster_url: string | null;
          slug: string | null;
          status: string | null;
          type: string | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [];
      };
      media_tv_series_aggregate_credits: {
        Row: {
          credits: Json | null;
          last_appearance_date: string | null;
          person_id: number | null;
          serie_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_backdrops: {
        Row: {
          aspect_ratio: number | null;
          backdrop_url: string | null;
          file_path: string | null;
          height: number | null;
          id: number | null;
          iso_639_1: string | null;
          serie_id: number | null;
          type: Database['public']['Enums']['image_type'] | null;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_casting: {
        Row: {
          credits: Json | null;
          order: number | null;
          person_id: number | null;
          serie_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_credits_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_episodes: {
        Row: {
          air_date: string | null;
          episode_number: number | null;
          episode_type: string | null;
          id: number | null;
          name: string | null;
          overview: string | null;
          production_code: string | null;
          runtime: number | null;
          season_id: number | null;
          season_number: number | null;
          serie_id: number | null;
          still_path: string | null;
          still_url: string | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_episodes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_episodes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series_seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_full: {
        Row: {
          backdrop_path: string | null;
          backdrop_url: string | null;
          created_by: Json[] | null;
          first_air_date: string | null;
          follower_avg_rating: number | null;
          genres: Json[] | null;
          id: number | null;
          in_production: boolean | null;
          last_air_date: string | null;
          name: string | null;
          number_of_episodes: number | null;
          number_of_seasons: number | null;
          original_language: string | null;
          original_name: string | null;
          overview: string | null;
          popularity: number | null;
          poster_path: string | null;
          poster_url: string | null;
          slug: string | null;
          status: string | null;
          trailers: Json | null;
          type: string | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [];
      };
      media_tv_series_posters: {
        Row: {
          aspect_ratio: number | null;
          file_path: string | null;
          height: number | null;
          id: number | null;
          iso_639_1: string | null;
          poster_url: string | null;
          serie_id: number | null;
          type: Database['public']['Enums']['image_type'] | null;
          vote_average: number | null;
          vote_count: number | null;
          width: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_images_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      media_tv_series_seasons: {
        Row: {
          episode_count: number | null;
          id: number | null;
          name: string | null;
          poster_path: string | null;
          poster_url: string | null;
          season_number: number | null;
          serie_id: number | null;
          url: string | null;
          vote_average: number | null;
          vote_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_tv_series_seasons_serie_id_fkey';
            columns: ['serie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      playlists_friends: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: number | null;
          items_count: number | null;
          likes_count: number | null;
          poster_url: string | null;
          private: boolean | null;
          saved_count: number | null;
          title: string | null;
          type: Database['public']['Enums']['playlists_type'] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      profile: {
        Row: {
          avatar_url: string | null;
          background_url: string | null;
          bio: string | null;
          created_at: string | null;
          favorite_color: string | null;
          followers_count: number | null;
          following_count: number | null;
          full_name: string | null;
          id: string | null;
          premium: boolean | null;
          private: boolean | null;
          username: string | null;
          visible: boolean | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          background_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          favorite_color?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id?: string | null;
          premium?: boolean | null;
          private?: boolean | null;
          username?: string | null;
          visible?: never;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          background_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          favorite_color?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id?: string | null;
          premium?: boolean | null;
          private?: boolean | null;
          username?: string | null;
          visible?: never;
          website?: string | null;
        };
        Relationships: [];
      };
      tmdb_movie_credits_random: {
        Row: {
          department: string | null;
          id: string | null;
          job: string | null;
          movie_id: number | null;
          person_id: number | null;
        };
        Insert: {
          department?: string | null;
          id?: string | null;
          job?: string | null;
          movie_id?: number | null;
          person_id?: number | null;
        };
        Update: {
          department?: string | null;
          id?: string | null;
          job?: string | null;
          movie_id?: number | null;
          person_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      tmdb_person_department: {
        Row: {
          department: string | null;
          person_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities: {
        Row: {
          created_at: string | null;
          id: number | null;
          is_liked: boolean | null;
          liked_at: string | null;
          media: Json | null;
          media_id: number | null;
          rated_at: string | null;
          rating: number | null;
          review: Json | null;
          type: string | null;
          updated_at: string | null;
          user: Json | null;
          user_id: string | null;
          watched_date: string | null;
        };
        Relationships: [];
      };
      user_activities_movie_follower: {
        Row: {
          created_at: string | null;
          id: number | null;
          is_liked: boolean | null;
          liked_at: string | null;
          movie_id: number | null;
          rated_at: string | null;
          rating: number | null;
          updated_at: string | null;
          user_id: string | null;
          watched_date: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities_movie_follower_average_rating: {
        Row: {
          follower_avg_rating: number | null;
          movie_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities_tv_series_follower: {
        Row: {
          created_at: string | null;
          id: number | null;
          is_liked: boolean | null;
          liked_at: string | null;
          rated_at: string | null;
          rating: number | null;
          tv_series_id: number | null;
          updated_at: string | null;
          user_id: string | null;
          watched_date: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities_tv_series_follower_average_rating: {
        Row: {
          follower_avg_rating: number | null;
          tv_series_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
        ];
      };
      user_feed_cast_crew: {
        Row: {
          jobs: string[] | null;
          movie_id: number | null;
          person_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'media_person';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tmdb_movie_credits_person_id_fkey';
            columns: ['person_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_person';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_aggregated: {
        Row: {
          created_at: string | null;
          media: Json | null;
          media_id: number | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      user_recos_aggregated_random: {
        Row: {
          created_at: string | null;
          media: Json | null;
          media_id: number | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      user_recos_movie_aggregated: {
        Row: {
          created_at: string | null;
          movie_id: number | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_movie_aggregated_random: {
        Row: {
          created_at: string | null;
          movie_id: number | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'media_movie_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_movie_id_fkey';
            columns: ['movie_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_movie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_movie_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_tv_series_aggregated: {
        Row: {
          created_at: string | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          tv_series_id: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recos_tv_series_aggregated_random: {
        Row: {
          created_at: string | null;
          senders: Json[] | null;
          status: Database['public']['Enums']['reco_status'] | null;
          tv_series_id: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'media_tv_series_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_tv_series_id_fkey';
            columns: ['tv_series_id'];
            isOneToOne: false;
            referencedRelation: 'tmdb_tv_series';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recos_tv_series_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_watchlists: {
        Row: {
          comment: string | null;
          created_at: string | null;
          id: number | null;
          media: Json | null;
          media_id: number | null;
          status: Database['public']['Enums']['watchlist_status'] | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      user_watchlists_random: {
        Row: {
          comment: string | null;
          created_at: string | null;
          id: number | null;
          media: Json | null;
          media_id: number | null;
          status: Database['public']['Enums']['watchlist_status'] | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      widget_most_popular: {
        Row: {
          media_id: number | null;
          popularity: number | null;
          type: Database['public']['Enums']['user_recos_type'] | null;
        };
        Relationships: [];
      };
      widget_most_recommended: {
        Row: {
          media_id: number | null;
          recommendation_count: number | null;
          type: Database['public']['Enums']['user_recos_type'] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      delete_avatar: {
        Args: { avatar_url: string };
        Returns: Record<string, unknown>;
      };
      delete_playlist_poster: {
        Args: { poster_url: string };
        Returns: Record<string, unknown>;
      };
      delete_storage_object: {
        Args: { bucket: string; object: string };
        Returns: Record<string, unknown>;
      };
      find_media: {
        Args: {
          p_media_id: number;
          p_media_type: Database['public']['Enums']['media_type'];
        };
        Returns: Json;
      };
      get_feed: {
        Args: {
          page_limit: number;
          page_offset: number;
          target_user_ids?: string[];
        };
        Returns: {
          activity_type: Database['public']['Enums']['feed_type'];
          author: Json;
          content: Json;
          created_at: string;
          feed_id: number;
          user_id: string;
        }[];
      };
      get_feed_cast_crew: {
        Args: { page_limit?: number; page_offset?: number };
        Returns: {
          jobs: string[];
          media: Json;
          media_id: number;
          media_type: Database['public']['Enums']['media_type'];
          person: Json;
          ref_date: string;
        }[];
      };
      get_notifications: {
        Args: { notif_list: Json };
        Returns: {
          content: Json;
          notification_id: string;
          type: Database['public']['Enums']['notification_type'];
        }[];
      };
      get_ui_backgrounds: {
        Args: never;
        Returns: {
          id: string;
          media: Json;
          media_id: number;
          media_type: Database['public']['Enums']['media_type'];
          url: string;
        }[];
      };
      get_widget_most_popular: {
        Args: never;
        Returns: {
          media: Json;
          media_id: number;
          popularity: number;
          type: Database['public']['Enums']['user_recos_type'];
        }[];
      };
      get_widget_most_recommended: {
        Args: never;
        Returns: {
          media: Json;
          media_id: number;
          recommendation_count: number;
          type: Database['public']['Enums']['user_recos_type'];
        }[];
      };
      importer_best_match_movie: {
        Args: {
          lang: string;
          search_title: string;
          search_year?: number;
          similarity_threshold?: number;
        };
        Returns: {
          directors: Json;
          id: number;
          language: string;
          popularity: number;
          release_date: string;
          title: string;
        }[];
      };
      is_maintenance: { Args: never; Returns: boolean };
      search_movies: {
        Args: {
          lang: string;
          page_number?: number;
          page_size?: number;
          search_query: string;
          similarity_threshold?: number;
        };
        Returns: {
          adult: boolean;
          backdrop_path: string;
          budget: number;
          collection_id: number;
          directors: Json[];
          follower_avg_rating: number;
          genres: Json[];
          homepage: string;
          id: number;
          imdb_id: string;
          language: Database['public']['Enums']['language_app'];
          original_language: string;
          original_title: string;
          overview: string;
          popularity: number;
          poster_path: string;
          release_date: string;
          revenue: number;
          runtime: number;
          status: string;
          tagline: string;
          title: string;
          vote_average: number;
          vote_count: number;
        }[];
      };
      slugify: { Args: { value: string }; Returns: string };
      user_recos_movie_insert: {
        Args: {
          comment?: string;
          p_movie_id: number;
          receiver_user_ids: string[];
          sender_user_id: string;
        };
        Returns: undefined;
      };
      user_recos_tv_series_insert: {
        Args: {
          comment?: string;
          p_tv_series_id: number;
          receiver_user_ids: string[];
          sender_user_id: string;
        };
        Returns: undefined;
      };
      utils_calculate_vote_average: {
        Args: { media_id: number };
        Returns: number;
      };
      utils_cancel_email_change: { Args: never; Returns: Json };
      utils_check_playlist_guest: {
        Args: { p_playlist_id: number; p_user_id: string };
        Returns: boolean;
      };
      utils_check_playlist_owner: {
        Args: { p_playlist_id: number; p_user_id: string };
        Returns: boolean;
      };
      utils_check_playlist_privacy: {
        Args: { p_playlist_id: number };
        Returns: boolean;
      };
      utils_check_playlist_type: {
        Args: { p_expected_type: string; p_playlist_id: number };
        Returns: boolean;
      };
      utils_check_user_following: {
        Args: { p_followee_id: string; p_follower_id: string };
        Returns: boolean;
      };
      utils_check_user_friendship: {
        Args: { user_id_1: string; user_id_2: string };
        Returns: boolean;
      };
      utils_check_user_privacy: { Args: { user_id: string }; Returns: boolean };
      utils_delete_expired_user_notification_tokens: {
        Args: never;
        Returns: undefined;
      };
      utils_delete_expired_users: { Args: never; Returns: undefined };
      utils_generate_username: {
        Args: { user_details: unknown };
        Returns: string;
      };
      utils_is_supported_language: { Args: { lang: string }; Returns: boolean };
    };
    Enums: {
      eventType: 'INSERT' | 'DELETE' | 'UPDATE';
      feed_type:
        | 'activity_movie'
        | 'activity_tv_series'
        | 'review_movie_like'
        | 'review_tv_series_like'
        | 'playlist_like';
      image_type: 'backdrop' | 'poster' | 'logo' | 'profile';
      language_app: 'en-US' | 'fr-FR';
      media_type: 'movie' | 'tv_series' | 'person' | 'tv_season' | 'tv_episode';
      notification_type:
        | 'follower_created'
        | 'follower_accepted'
        | 'follower_request'
        | 'friend_created'
        | 'reco_sent'
        | 'reco_completed'
        | 'reco_sent_movie'
        | 'reco_sent_tv_series'
        | 'reco_completed_movie'
        | 'reco_completed_tv_series';
      notifications_device_type:
        | 'web'
        | 'ios'
        | 'android'
        | 'windows'
        | 'macos';
      notifications_provider: 'fcm' | 'expo' | 'apns';
      playlists_type: 'movie' | 'tv_series';
      pricing_plan_interval: 'day' | 'week' | 'month' | 'year';
      pricing_type: 'one_time' | 'recurring';
      reco_status: 'active' | 'completed' | 'deleted';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid';
      sync_logs_status:
        | 'initialized'
        | 'fetching_data'
        | 'data_fetched'
        | 'syncing_to_db'
        | 'updating_popularity'
        | 'success'
        | 'failed';
      sync_logs_type:
        | 'tmdb_movie'
        | 'tmdb_person'
        | 'tmdb_collection'
        | 'tmdb_keyword'
        | 'tmdb_company'
        | 'tmdb_language'
        | 'tmdb_country'
        | 'tmdb_genre'
        | 'tmdb_network'
        | 'tmdb_tv_serie';
      user_activity_type: 'movie' | 'tv_series';
      user_recos_type: 'movie' | 'tv_series';
      user_review_type: 'movie' | 'tv_series';
      user_watchlist_type: 'movie' | 'tv_series';
      watchlist_status: 'active' | 'completed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      eventType: ['INSERT', 'DELETE', 'UPDATE'],
      feed_type: [
        'activity_movie',
        'activity_tv_series',
        'review_movie_like',
        'review_tv_series_like',
        'playlist_like',
      ],
      image_type: ['backdrop', 'poster', 'logo', 'profile'],
      language_app: ['en-US', 'fr-FR'],
      media_type: ['movie', 'tv_series', 'person', 'tv_season', 'tv_episode'],
      notification_type: [
        'follower_created',
        'follower_accepted',
        'follower_request',
        'friend_created',
        'reco_sent',
        'reco_completed',
        'reco_sent_movie',
        'reco_sent_tv_series',
        'reco_completed_movie',
        'reco_completed_tv_series',
      ],
      notifications_device_type: ['web', 'ios', 'android', 'windows', 'macos'],
      notifications_provider: ['fcm', 'expo', 'apns'],
      playlists_type: ['movie', 'tv_series'],
      pricing_plan_interval: ['day', 'week', 'month', 'year'],
      pricing_type: ['one_time', 'recurring'],
      reco_status: ['active', 'completed', 'deleted'],
      subscription_status: [
        'trialing',
        'active',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'past_due',
        'unpaid',
      ],
      sync_logs_status: [
        'initialized',
        'fetching_data',
        'data_fetched',
        'syncing_to_db',
        'updating_popularity',
        'success',
        'failed',
      ],
      sync_logs_type: [
        'tmdb_movie',
        'tmdb_person',
        'tmdb_collection',
        'tmdb_keyword',
        'tmdb_company',
        'tmdb_language',
        'tmdb_country',
        'tmdb_genre',
        'tmdb_network',
        'tmdb_tv_serie',
      ],
      user_activity_type: ['movie', 'tv_series'],
      user_recos_type: ['movie', 'tv_series'],
      user_review_type: ['movie', 'tv_series'],
      user_watchlist_type: ['movie', 'tv_series'],
      watchlist_status: ['active', 'completed'],
    },
  },
} as const;
