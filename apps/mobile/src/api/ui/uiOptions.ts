import { queryOptions } from "@tanstack/react-query"
import { File, Directory, Paths } from 'expo-file-system';
import { logger } from "apps/mobile/src/logger";
import { uiKeys } from "./uiKeys";
import { uiBackgroundsControllerListAll } from "@libs/api-js";

const UI_DIRECTORY = new Directory(Paths.cache, 'ui');
const UI_BACKGROUND_DIRECTORY = new Directory(UI_DIRECTORY, 'backgrounds');

export const uiBackgroundsOptions = () => {
    return queryOptions({
        queryKey: uiKeys.backgrounds(),
        queryFn: async () => {
            const { data, error } = await uiBackgroundsControllerListAll();
            if (error) throw error;
			if (!data) throw new Error('No data');
            
            if (!UI_BACKGROUND_DIRECTORY.exists) {
                UI_BACKGROUND_DIRECTORY.create({
                    intermediates: true,
                });
            }

            const entries = UI_BACKGROUND_DIRECTORY.list();
            const localFiles = entries.filter((entry) => entry instanceof File);
            const validIds = new Set(data.map(item => item.id.toString()));

            // Remove files that are no longer valid
            for (const file of localFiles) {
                const id = file.name.split('.')[0];
                if (!validIds.has(id)) {
                    file.delete();
                    logger.info(`🗑️ Removed outdated UI background ${id}`);
                }
            }

			// Download missing files
            const cached = await Promise.all(
                data.map(async (item) => {
                    const file = new File(UI_BACKGROUND_DIRECTORY, `${item.id}.jpg`);
                    
                    if (!file.exists) {
                        try {
                            await File.downloadFileAsync(item.url, file);
                            logger.log(`✅ Cached UI background ${item.id}`);
                        } catch (e) {
                            logger.error(`❌ Failed to cache ${item.url}: ${e}`);
                        }
                    }

                    return { ...item, localUri: file.uri };
                })
            );

            return cached;
        },
    });
};