import { create } from "zustand";
import songs from "../data/songs";

// プレイヤーが扱う楽曲データの形。
// data/songs.js の各要素と同じ項目を持たせる。
export type Song = {
    id: number;
    title: string;
    audioFilePath: string;
};

// どのコンポーネントからでも参照・更新する再生状態と操作をまとめる。
type PlayerStore = {
    // 現在選択されている曲。未選択の間は null。
    currentSong: Song | null;
    // 音声を再生すべき状態かどうか。
    isPlaying: boolean;
    // 現在の再生位置と、音源から取得した総再生時間（秒）。
    currentTime: number;
    duration: number;
    // audio 要素へ反映する音量。0 が無音、1 が最大。
    volume: number;
    // ミニプレイヤーなど、audio 要素を持たないUIからのシーク要求。
    seekRequestTime: number | null;

    // 曲を選択し、再生状態にする。
    playSong: (song: Song) => void;
    // 再生と一時停止を切り替える。
    togglePlay: () => void;
    // 曲の終了時など、再生状態だけを停止にする。
    pause: () => void;
    // 前後の曲へ切り替える。
    previous: () => void;
    next: () => void;
    // audio 要素が通知した再生時間・総再生時間・音量を保存する。
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    requestSeek: (time: number) => void;
    clearSeekRequest: () => void;
};

// Zustand のストア。Client Component から usePlayerStore を呼び出して使う。
export const usePlayerStore = create<PlayerStore>((set, get) => ({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.1,
    seekRequestTime: null,

    playSong: (song) =>
        set({
            currentSong: song,
            isPlaying: true,
            currentTime: 0,
            duration: 0,
        }),

    togglePlay: () =>
        set((state) => ({
            isPlaying: !state.isPlaying,
        })),

    pause: () =>
        set({
            isPlaying: false,
        }),

    previous: () => {
        const currentSong = get().currentSong;

        if (!currentSong) {
            return;
        }

        const currentIndex = songs.findIndex(
            (song) => song.id === currentSong.id,
        );
        const previousSong =
            songs[(currentIndex - 1 + songs.length) % songs.length];

        set({
            currentSong: previousSong,
            isPlaying: true,
            currentTime: 0,
            duration: 0,
        });
    },

    next: () => {
        const currentSong = get().currentSong;

        if (!currentSong) {
            return;
        }

        const currentIndex = songs.findIndex(
            (song) => song.id === currentSong.id,
        );
        const nextSong = songs[(currentIndex + 1) % songs.length];

        set({
            currentSong: nextSong,
            isPlaying: true,
            currentTime: 0,
            duration: 0,
        });
    },

    setCurrentTime: (time) =>
        set({
            currentTime: time,
        }),

    setDuration: (duration) =>
        set({
            duration,
        }),

    setVolume: (volume) =>
        set({
            volume,
        }),

    requestSeek: (time) =>
        set({
            seekRequestTime: time,
        }),

    clearSeekRequest: () =>
        set({
            seekRequestTime: null,
        }),
}));
