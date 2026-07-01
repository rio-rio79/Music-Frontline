"use client";

import { useEffect } from "react";
import { useLikeStore } from "@/stores/likeStore";

export default function LikeInitializer() {
    const fetchLikes = useLikeStore((state) => state.fetchLikes);

    useEffect(() => {
        fetchLikes();
    }, [fetchLikes]);

    return null;
}
