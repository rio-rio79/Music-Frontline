export const FAVORITE_COLOR_STORAGE_KEY = 'favoriteColor'
export const DEFAULT_FAVORITE_COLOR = '#F8BBD0'

export const FAVORITE_COLOR_OPTIONS = [
    { value: '#FF9AA2', label: 'パステルレッド' },
    { value: '#F8BBD0', label: 'パステルピンク' },
    { value: '#F5CBA7', label: 'パステルオレンジ' },
    { value: '#FFF4A3', label: 'パステルイエロー' },
    { value: '#C8E6C9', label: 'パステルグリーン' },
    { value: '#B3E5FC', label: 'パステルスカイ' },
    { value: '#A7C7E7', label: 'パステルブルー' },
    { value: '#D1C4E9', label: 'パステルパープル' },
    { value: '#F5F5F5', label: 'ホワイト' },
    { value: '#ffd700', label: 'ゴールド' },
    { value: '#000000', label: 'ブラック' },
] as const

export function isFavoriteColorOption(value: string): boolean {
    return FAVORITE_COLOR_OPTIONS.some((color) => color.value === value)
}

export function applyFavoriteColor(color: string) {
    document.documentElement.style.setProperty('--favorite-color', color)
}
