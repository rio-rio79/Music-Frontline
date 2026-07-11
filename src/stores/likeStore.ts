import { create } from "zustand";
import { type Song } from "./playerStore";

export type JuniorLikeItem = {
    id: string;
    name: string;
    groupName: string | null;
    imageUrl: string | null;
};

type LikeStore = {
    likedSongs: Song[];
    likedSongIds: string[];
    likedJuniors: JuniorLikeItem[];
    likedJuniorIds: string[];
    loading: boolean;
    isLoggedIn: boolean;
    fetchLikes: () => Promise<void>;
    toggleLike: (songId: string) => Promise<boolean | null>;
    isLiked: (songId: string) => boolean;
    fetchJuniorLikes: () => Promise<void>;
    toggleJuniorLike: (juniorId: string) => Promise<boolean | null>;
    isJuniorLiked: (juniorId: string) => boolean;
    clearLikes: () => void;
};

type SongLikesResponse = {
    songs?: Song[];
};

type JuniorLikesResponse = {
    juniors?: JuniorLikeItem[];
};

export const useLikeStore = create<LikeStore>((set, get) => ({
    likedSongs: [],
    likedSongIds: [],
    likedJuniors: [],
    likedJuniorIds: [],
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
                const data = await res.json() as SongLikesResponse;
                const songs = data.songs || [];
                const ids = songs.map((song) => song.id);
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
                    set({ likedSongIds: currentIds.includes(songId) ? currentIds : [...currentIds, songId] });
                    // いいねが追加された際は、楽曲情報を取得するために
                    // サーバーから最新のいいね一覧を再フェッチして同期します
                    await get().fetchLikes();
                } else {
                    set({
                        likedSongIds: currentIds.filter(id => id !== songId),
                        likedSongs: get().likedSongs.filter(song => song.id !== songId),
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

    fetchJuniorLikes: async () => {
        set({ loading: true });
        try {
            const res = await fetch("/api/likes/juniors");
            if (res.status === 401) {
                set({ isLoggedIn: false, likedJuniors: [], likedJuniorIds: [] });
                return;
            }
            if (res.ok) {
                const data = await res.json() as JuniorLikesResponse;
                const juniors = data.juniors || [];
                const ids = juniors.map((junior) => junior.id);
                set({ likedJuniors: juniors, likedJuniorIds: ids, isLoggedIn: true });
            }
        } catch (error) {
            console.error("Failed to fetch junior likes", error);
        } finally {
            set({ loading: false });
        }
    },

    toggleJuniorLike: async (juniorId) => {
        try {
            const res = await fetch("/api/likes/juniors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ juniorId }),
            });

            if (res.status === 401) {
                set({ isLoggedIn: false });
                return null;
            }

            if (res.ok) {
                const data = await res.json();
                const currentIds = get().likedJuniorIds;

                if (data.liked) {
                    set({ likedJuniorIds: currentIds.includes(juniorId) ? currentIds : [...currentIds, juniorId] });
                    await get().fetchJuniorLikes();
                } else {
                    set({
                        likedJuniorIds: currentIds.filter(id => id !== juniorId),
                        likedJuniors: get().likedJuniors.filter(junior => junior.id !== juniorId),
                    });
                }
                return data.liked;
            }
        } catch (error) {
            console.error("Failed to toggle junior like", error);
        }
        return null;
    },

    isJuniorLiked: (juniorId) => {
        return get().likedJuniorIds.includes(juniorId);
    },

    clearLikes: () => {
        set({ likedSongs: [], likedSongIds: [], likedJuniors: [], likedJuniorIds: [], isLoggedIn: true });
    }
}));
