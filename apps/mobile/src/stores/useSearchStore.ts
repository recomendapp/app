import { create } from "zustand";

export type SearchType = "movies" | "tv_series" | "persons" | "playlists" | "users";

type SearchStore = {
    search: string;
    setSearch: (search: string) => void;
    isFocused: boolean;
    setIsFocused: (isFocused: boolean) => void;
};

const useSearchStore = create<SearchStore>((set, get) => ({
    search: "",
    setSearch: (search) => set({ search }),
    isFocused: false,
    setIsFocused: (isFocused) => set({ isFocused }),
}));

export default useSearchStore;
export type { SearchStore };