import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  importsControllerCreate,
  ImportsControllerCreateData,
  importsControllerDelete,
  importsControllerValidate,
  importLogMoviesControllerPatch,
  ImportLogMoviesControllerPatchData,
  importLogMovieReviewsControllerPatch,
  ImportLogMovieReviewsControllerPatchData,
  importLogTvSeriesControllerPatch,
  ImportLogTvSeriesControllerPatchData,
  importLogTvSeriesReviewsControllerPatch,
  ImportLogTvSeriesReviewsControllerPatchData,
  importBookmarksControllerPatch,
  ImportBookmarksControllerPatchData,
  importPlaylistItemsControllerPatch,
  ImportPlaylistItemsControllerPatchData,
  importPlaylistsControllerPatch,
  ImportPlaylistsControllerPatchData,
  ImportJob,
  ImportJobBookmark,
  ImportJobLogMovie,
  ImportJobLogTvSeries,
  ImportJobPlaylist,
  ImportJobPlaylistItem,
  ListInfiniteImportBookmarks,
  ListInfiniteImportJobs,
  ListInfiniteImportLogMovies,
  ListInfiniteImportLogTvSeries,
  ListInfiniteImportPlaylistItems,
  ListInfiniteImportPlaylists,
  ListPaginatedImportBookmarks,
  ListPaginatedImportJobs,
  ListPaginatedImportLogMovies,
  ListPaginatedImportLogTvSeries,
  ListPaginatedImportPlaylistItems,
  ListPaginatedImportPlaylists,
  Options,
} from '@libs/api-js';
import { importKeys } from './importKeys';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';

export const useImportCreateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      provider,
    }: {
      file: File;
      provider: NonNullable<ImportsControllerCreateData['query']>['provider'];
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await importsControllerCreate({
        query: { provider },
        body: formData as unknown as string,
        bodySerializer: (fd) => fd,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data) => {
      // A brand-new job can't be spliced into an existing paginated/infinite page without
      // breaking its offsets/cursor — only the flat "all" cache can be safely prepended to.
      queryClient.setQueriesData<ImportJob[] | undefined>(
        { queryKey: importKeys.lists({ mode: 'all' }) },
        (old) => (old ? [data, ...old] : [data]),
      );
      queryClient.invalidateQueries({ queryKey: importKeys.lists({ mode: 'paginated' }) });
      queryClient.invalidateQueries({ queryKey: importKeys.lists({ mode: 'infinite' }) });
    },
  });
};

export const useImportDeleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await importsControllerDelete({ path: { id } });
      if (error) throw error;
      return { id };
    },
    onSuccess: ({ id }) => {
      queryClient.removeQueries({ queryKey: importKeys.details(id) });
      removeListItemFromAllCaches<ImportJob, ListPaginatedImportJobs, ListInfiniteImportJobs>(
        queryClient,
        {
          all: importKeys.lists({ mode: 'all' }),
          paginated: importKeys.lists({ mode: 'paginated' }),
          infinite: importKeys.lists({ mode: 'infinite' }),
        },
        id,
      );
    },
  });
};

export const useImportValidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { data, error } = await importsControllerValidate({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(importKeys.details(data.id), data);
      updateListItemInAllCaches<ImportJob, ListPaginatedImportJobs, ListInfiniteImportJobs>(
        queryClient,
        {
          all: importKeys.lists({ mode: 'all' }),
          paginated: importKeys.lists({ mode: 'paginated' }),
          infinite: importKeys.lists({ mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};

export const useImportPatchLogMovieMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportLogMoviesControllerPatchData, false>) => {
      const { data, error } = await importLogMoviesControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobLogMovie,
        ListPaginatedImportLogMovies,
        ListInfiniteImportLogMovies
      >(
        queryClient,
        {
          all: importKeys.logMovies(id, { mode: 'all' }),
          paginated: importKeys.logMovies(id, { mode: 'paginated' }),
          infinite: importKeys.logMovies(id, { mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};

// The review is displayed via the embedded `review` field on the log-movies list query, not a
// separate cache entry — so the patch result must be merged into that list's cached item, not
// written to its own key (nothing reads importKeys.logMovieReview(...) anymore).
export const useImportPatchLogMovieReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportLogMovieReviewsControllerPatchData, false>) => {
      const { data, error } = await importLogMovieReviewsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobLogMovie,
        ListPaginatedImportLogMovies,
        ListInfiniteImportLogMovies
      >(
        queryClient,
        {
          all: importKeys.logMovies(id, { mode: 'all' }),
          paginated: importKeys.logMovies(id, { mode: 'paginated' }),
          infinite: importKeys.logMovies(id, { mode: 'infinite' }),
        },
        { review: data },
        variables.path.itemId,
      );
    },
  });
};

export const useImportPatchLogTvSeriesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportLogTvSeriesControllerPatchData, false>) => {
      const { data, error } = await importLogTvSeriesControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobLogTvSeries,
        ListPaginatedImportLogTvSeries,
        ListInfiniteImportLogTvSeries
      >(
        queryClient,
        {
          all: importKeys.logTvSeries(id, { mode: 'all' }),
          paginated: importKeys.logTvSeries(id, { mode: 'paginated' }),
          infinite: importKeys.logTvSeries(id, { mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};

// Same reasoning as useImportPatchLogMovieReviewMutation above: patch the log-tv-series list's
// embedded `review` field rather than a dead standalone cache key.
export const useImportPatchLogTvSeriesReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportLogTvSeriesReviewsControllerPatchData, false>) => {
      const { data, error } = await importLogTvSeriesReviewsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobLogTvSeries,
        ListPaginatedImportLogTvSeries,
        ListInfiniteImportLogTvSeries
      >(
        queryClient,
        {
          all: importKeys.logTvSeries(id, { mode: 'all' }),
          paginated: importKeys.logTvSeries(id, { mode: 'paginated' }),
          infinite: importKeys.logTvSeries(id, { mode: 'infinite' }),
        },
        { review: data },
        variables.path.itemId,
      );
    },
  });
};

export const useImportPatchBookmarkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportBookmarksControllerPatchData, false>) => {
      const { data, error } = await importBookmarksControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobBookmark,
        ListPaginatedImportBookmarks,
        ListInfiniteImportBookmarks
      >(
        queryClient,
        {
          all: importKeys.bookmarks(id, { mode: 'all' }),
          paginated: importKeys.bookmarks(id, { mode: 'paginated' }),
          infinite: importKeys.bookmarks(id, { mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};

export const useImportPatchPlaylistItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportPlaylistItemsControllerPatchData, false>) => {
      const { data, error } = await importPlaylistItemsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const { id, playlistId } = variables.path;
      updateListItemInAllCaches<
        ImportJobPlaylistItem,
        ListPaginatedImportPlaylistItems,
        ListInfiniteImportPlaylistItems
      >(
        queryClient,
        {
          all: importKeys.playlistItems(id, playlistId, { mode: 'all' }),
          paginated: importKeys.playlistItems(id, playlistId, { mode: 'paginated' }),
          infinite: importKeys.playlistItems(id, playlistId, { mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};

export const useImportPatchPlaylistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Options<ImportPlaylistsControllerPatchData, false>) => {
      const { data, error } = await importPlaylistsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables.path.id;
      updateListItemInAllCaches<
        ImportJobPlaylist,
        ListPaginatedImportPlaylists,
        ListInfiniteImportPlaylists
      >(
        queryClient,
        {
          all: importKeys.playlists(id, { mode: 'all' }),
          paginated: importKeys.playlists(id, { mode: 'paginated' }),
          infinite: importKeys.playlists(id, { mode: 'infinite' }),
        },
        data,
        data.id,
      );
    },
  });
};
