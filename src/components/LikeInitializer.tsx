"use client";

import { useEffect } from "react";
import { useLikeStore } from "@/stores/likeStore";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LikeInitializer() {
    const fetchLikes = useLikeStore((state) => state.fetchLikes);
    const clearLikes = useLikeStore((state) => state.clearLikes);

    useEffect(() => {
        const supabase = createSupabaseBrowser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session) {
                    fetchLikes();
                } else {
                    clearLikes();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchLikes, clearLikes]);

    return null;
}
