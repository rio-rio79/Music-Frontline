import { create } from "zustand";
import { type Song } from "./playerStore";

type LikeStore = {
    likedSongs: Song[];
    likedSongIds: string[];
    loading: boolean;
    isLoggedIn: boolean;
    fetchLikes: () => Promise<void>;
    toggleLike: (songId: string) => Promise<boolean | null>;
    isLiked: (songId: string) => boolean;
    clearLikes: () => void;
};

export const useLikeStore = create<LikeStore>((set, get) => ({
    likedSongs: [],
    likedSongIds: [],
    loading: false,
    isLoggedIn: true,

    fetchLikes: async () => {
        set({ loading: true });
        try {
            const res = await fetch("/api/likes/songs");
            if (res.status === 401) {
                set({ isLoggedIn: false, likedSongs: [], likedSongIds: [] });
                return;
            }
            if (res.ok) {
                const data = await res.json();
                const songs = data.songs || [];
                const ids = songs.map((song: any) => song.id);
                set({ likedSongs: songs, likedSongIds: ids, isLoggedIn: true });
            }
        } catch (error) {
            console.error("Failed to fetch likes", error);
        } finally {
            set({ loading: false });
        }
    },

    toggleLike: async (songId) => {
        try {
            const res = await fetch("/api/likes/songs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ songId }),
            });

            if (res.status === 401) {
                set({ isLoggedIn: false });
                return null;
            }

            if (res.ok) {
                const data = await res.json();
                const currentIds = get().likedSongIds;

                if (data.liked) {
                    set({ likedSongIds: [...currentIds, songId] });
                    // いいねが追加された際は、楽曲情報を取得するために
                    // サーバーから最新のいいね一覧を再フェッチして同期します
                    await get().fetchLikes();
                } else {
                    set({
                        likedSongIds: currentIds.filter(id => id !== songId),
                    });
                }
                return data.liked;
            }
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
        return null;
    },

    isLiked: (songId) => {
        return get().likedSongIds.includes(songId);
    },

    clearLikes: () => {
        set({ likedSongs: [], likedSongIds: [], isLoggedIn: true });
    }
}));
