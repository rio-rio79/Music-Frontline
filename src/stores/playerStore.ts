import { create } from "zustand";

// プレイヤーが扱う楽曲データの形。
export type Song = {
    id: string; // number から string に変更 (Supabase UUIDに対応)
    title: string;
    audioFilePath: string;
    imagePath?: string;
    artistName?: string;
    juniors?: string[];
    groups?: string[];
    playCount?: number;
    publishedAt?: string;
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
    // 現在の再生リスト（キュー）
    queue: Song[];

    // 曲を選択し、再生状態にする。現在のプレイリストもキューとして受け取れるようにする。
    playSong: (song: Song, newQueue?: Song[]) => void;
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
    // キューを明示的に更新する。
    setQueue: (queue: Song[]) => void;
};

// Zustand のストア。Client Component から usePlayerStore を呼び出して使う。
export const usePlayerStore = create<PlayerStore>((set, get) => ({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.1,
    seekRequestTime: null,
    queue: [],

    playSong: (song, newQueue) => {
        const updateObj: Partial<PlayerStore> = {
            currentSong: song,
            isPlaying: true,
            currentTime: 0,
            duration: 0,
        };
        // 新しいキューが指定された場合は設定し、指定がない場合でかつ既存キューになければキューに追加
        if (newQueue) {
            updateObj.queue = newQueue;
        } else {
            const currentQueue = get().queue;
            if (!currentQueue.some(s => s.id === song.id)) {
                updateObj.queue = [...currentQueue, song];
            }
        }
        set(updateObj);
    },

    togglePlay: () =>
        set((state) => ({
            isPlaying: !state.isPlaying,
        })),

    pause: () =>
        set({
            isPlaying: false,
        }),

    previous: () => {
        const { currentSong, queue } = get();

        if (!currentSong || queue.length === 0) {
            return;
        }

        const currentIndex = queue.findIndex(
            (song) => song.id === currentSong.id,
        );
        
        // キュー内に見つからない場合は処理しない
        if (currentIndex === -1) {
            return;
        }

        const previousSong =
            queue[(currentIndex - 1 + queue.length) % queue.length];

        set({
            currentSong: previousSong,
            isPlaying: true,
            currentTime: 0,
            duration: 0,
        });
    },

    next: () => {
        const { currentSong, queue } = get();

        if (!currentSong || queue.length === 0) {
            return;
        }

        const currentIndex = queue.findIndex(
            (song) => song.id === currentSong.id,
        );

        // キュー内に見つからない場合は処理しない
        if (currentIndex === -1) {
            return;
        }

        const nextSong = queue[(currentIndex + 1) % queue.length];

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

    setQueue: (queue) =>
        set({
            queue,
        }),
}));
