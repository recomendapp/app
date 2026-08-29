import { useMutation } from '@tanstack/react-query';
import {
  importControllerCreate,
  ImportControllerCreateData,
  importControllerDelete,
  importControllerValidate,
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
  Options,
} from '@libs/api-js';

export const useImportCreateMutation = () => {
  return useMutation({
    mutationFn: async ({
      file,
      provider,
    }: {
      file: File;
      provider: ImportControllerCreateData['path']['slug'];
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await importControllerCreate({
        path: { slug: provider },
        body: formData as unknown as string,
        bodySerializer: (fd: FormData) => fd,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportDeleteMutation = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await importControllerDelete({ path: { id } });
      if (error) throw error;
      return { id };
    },
  });
};

export const useImportValidateMutation = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { data, error } = await importControllerValidate({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

// Cache updates for these patch mutations arrive via realtime (see useRealtimeSyncImports /
// ImportServerEvents.*_PATCHED), not onSuccess — mirrors useImportCreateMutation etc. above.
export const useImportPatchLogMovieMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportLogMoviesControllerPatchData, false>) => {
      const { data, error } = await importLogMoviesControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchLogMovieReviewMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportLogMovieReviewsControllerPatchData, false>) => {
      const { data, error } = await importLogMovieReviewsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchLogTvSeriesMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportLogTvSeriesControllerPatchData, false>) => {
      const { data, error } = await importLogTvSeriesControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchLogTvSeriesReviewMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportLogTvSeriesReviewsControllerPatchData, false>) => {
      const { data, error } = await importLogTvSeriesReviewsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchBookmarkMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportBookmarksControllerPatchData, false>) => {
      const { data, error } = await importBookmarksControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchPlaylistItemMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportPlaylistItemsControllerPatchData, false>) => {
      const { data, error } = await importPlaylistItemsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const useImportPatchPlaylistMutation = () => {
  return useMutation({
    mutationFn: async (variables: Options<ImportPlaylistsControllerPatchData, false>) => {
      const { data, error } = await importPlaylistsControllerPatch(variables);
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};
