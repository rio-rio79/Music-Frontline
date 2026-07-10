'use client'

import { useEffect } from 'react'
import {
    applyFavoriteColor,
    DEFAULT_FAVORITE_COLOR,
    FAVORITE_COLOR_STORAGE_KEY,
} from '@/lib/favorite-color'

type FavoriteColorInitializerProps = {
    initialColor?: string | null
}

export default function FavoriteColorInitializer({
    initialColor = null,
}: FavoriteColorInitializerProps) {
    useEffect(() => {
        if (initialColor) {
            applyFavoriteColor(initialColor)
            localStorage.setItem(FAVORITE_COLOR_STORAGE_KEY, initialColor)
            return
        }

        const savedColor = localStorage.getItem(FAVORITE_COLOR_STORAGE_KEY)
        applyFavoriteColor(savedColor || DEFAULT_FAVORITE_COLOR)
    }, [initialColor])

    return null
}
