import { useQueryClient } from "@tanstack/react-query";
import { Profile, User } from "@libs/api-js";
import { resolveUpdater, ItemUpdater } from "../utils";
import { userByIdOptions, userByUsernameOptions } from "../users";
import { meOptions } from "../me";
import { useCallback } from "react";

export const useUserCacheUpdate = () => {
    const queryClient = useQueryClient();
    
    return useCallback((user: User, updater: ItemUpdater<User | Profile>) => {
        
        queryClient.setQueryData(meOptions().queryKey, (old) => {
            if (!old || old.id !== user.id) return old;
            return {
                ...old,
                ...resolveUpdater(old, updater),
            };
        });

        queryClient.setQueryData(userByIdOptions({ userId: user.id }).queryKey, (old) => {
            if (!old) return undefined;
            return {
                ...old,
                ...resolveUpdater(old, updater),
            };
        });

        queryClient.setQueryData(userByUsernameOptions({ username: user.username }).queryKey, (old) => {
            if (!old) return undefined;
            return {
                ...old,
                ...resolveUpdater(old, updater),
            };
        });
    }, [queryClient]);
};