export const FAVORITE_COLOR_STORAGE_KEY = 'favoriteColor'
export const DEFAULT_FAVORITE_COLOR = '#F8BBD0'

type Rgb = {
    r: number
    g: number
    b: number
}

type Hsl = {
    h: number
    s: number
    l: number
}

export type FavoriteTheme = {
    accent: string
    mid: string
    soft: string
    bg: string
    bgSide: string
    line: string
    deep: string
    mauve: string
    box: string
    onAccent: string
}

const BASE_HUE = 340
const DARK_ON_ACCENT = '#3a3320'

const BASE_THEME: FavoriteTheme = {
    accent: '#e8447a',
    mid: '#ff4f8b',
    soft: '#f8bbd0',
    bg: '#fff2f7',
    bgSide: '#ffe1ec',
    line: '#f0e3e8',
    deep: '#5d153f',
    mauve: '#b58a9a',
    box: '#fdfdfd',
    onAccent: '#ffffff',
}

const CUSTOM_PALETTES: Record<string, Omit<FavoriteTheme, 'onAccent'>> = {
    '#FFF4A3': {
        accent: '#D1B500',
        mid: '#E0C200',
        soft: '#FFFAD6',
        bg: '#FFFADB',
        bgSide: '#FEEF9A',
        line: '#E7E6E2',
        deep: '#635612',
        mauve: '#B1A23E',
        box: '#FFFDF0',
    },
    '#B3E5FC': {
        accent: '#24D3FF',
        mid: '#00D0FF',
        soft: '#E5FAFF',
        bg: '#EBFCFF',
        bgSide: '#BDF4FF',
        line: '#EBFCFF',
        deep: '#16727E',
        mauve: '#2C93AA',
        box: '#F6FDFE',
    },
    '#A7C7E7': {
        accent: '#2D58D7',
        mid: '#3F75FD',
        soft: '#C7D7FF',
        bg: '#F0F4FF',
        bgSide: '#CDDCFE',
        line: '#E3E6EE',
        deep: '#205383',
        mauve: '#3B5DA5',
        box: '#FBFCFE',
    },
    '#FFD700': {
        accent: '#EFAD1F',
        mid: '#DD9C2C',
        soft: '#FFE8C2',
        bg: '#FFE5B8',
        bgSide: '#FFD894',
        line: '#E8E6E3',
        deep: '#7E4C02',
        mauve: '#9E6400',
        box: '#FFFAF0',
    },
    '#F5F5F5': {
        accent: '#FFFFFD',
        mid: '#BDBDBD',
        soft: '#F2F2F2',
        bg: '#FAFAFA',
        bgSide: '#F5F5F5',
        line: '#F2F2F2',
        deep: '#969696',
        mauve: '#999999',
        box: '#FDFDFD',
    },
    '#000000': {
        accent: '#000000',
        mid: '#000000',
        soft: '#707070',
        bg: '#F5F5F5',
        bgSide: '#A3A3A3',
        line: '#E7E6E6',
        deep: '#353134',
        mauve: '#000000',
        box: '#FFFFFF',
    },
}

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
    const theme = createFavoriteTheme(color)

    Object.entries(getFavoriteThemeCssVariables(theme, color)).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value)
    })
}

export function createFavoriteTheme(color: string | null | undefined): FavoriteTheme {
    const normalizedColor = normalizeHex(color) ?? DEFAULT_FAVORITE_COLOR
    const customPalette = CUSTOM_PALETTES[normalizedColor.toUpperCase()]

    if (customPalette) {
        return withOnAccent(customPalette)
    }

    const selectedRgb = hexToRgb(normalizedColor)
    if (!selectedRgb) return BASE_THEME

    const selectedHsl = rgbToHsl(selectedRgb)
    const hueDistance = circularDistance(selectedHsl.h, BASE_HUE)

    if (hueDistance <= 10) return BASE_THEME

    const grayscale = selectedHsl.s < 0.1
    const targetHue = adjustHue(selectedHsl.h)

    const theme = Object.fromEntries(
        Object.entries(BASE_THEME)
            .filter(([key]) => key !== 'onAccent')
            .map(([key, value]) => {
                const baseRgb = hexToRgb(value)
                if (!baseRgb) return [key, value]

                const baseHsl = rgbToHsl(baseRgb)
                const targetSaturation = grayscale
                    ? 0
                    : clamp(baseHsl.s * saturationMultiplier(targetHue), 0, 1)
                const targetLuminance = relativeLuminance(baseRgb)
                const nextColor = hslWithLuminance(targetHue, targetSaturation, targetLuminance)

                return [key, rgbToHex(nextColor)]
            }),
    ) as Omit<FavoriteTheme, 'onAccent'>

    return withOnAccent(theme)
}

export function getFavoriteThemeCssVariables(
    theme: FavoriteTheme,
    sourceColor = DEFAULT_FAVORITE_COLOR,
): Record<string, string> {
    return {
        '--favorite-color': sourceColor,
        '--oshi-accent': theme.accent,
        '--oshi-mid': theme.mid,
        '--oshi-soft': theme.soft,
        '--oshi-bg': theme.bg,
        '--oshi-bg-side': theme.bgSide,
        '--oshi-line': theme.line,
        '--oshi-deep': theme.deep,
        '--oshi-mauve': theme.mauve,
        '--oshi-box': theme.box,
        '--oshi-on-accent': theme.onAccent,
        '--oshi-accent-rgb': rgbTriplet(theme.accent),
        '--oshi-mid-rgb': rgbTriplet(theme.mid),
        '--oshi-soft-rgb': rgbTriplet(theme.soft),
        '--oshi-bg-rgb': rgbTriplet(theme.bg),
        '--oshi-bg-side-rgb': rgbTriplet(theme.bgSide),
        '--oshi-line-rgb': rgbTriplet(theme.line),
    }
}

export function getFavoriteColorCssVariables(
    color: string | null | undefined,
): Record<string, string> {
    const normalizedColor = normalizeHex(color) ?? DEFAULT_FAVORITE_COLOR
    return getFavoriteThemeCssVariables(createFavoriteTheme(normalizedColor), normalizedColor)
}

function withOnAccent(theme: Omit<FavoriteTheme, 'onAccent'>): FavoriteTheme {
    const accentRgb = hexToRgb(theme.accent)
    const onAccent = accentRgb && relativeLuminance(accentRgb) > 0.55
        ? DARK_ON_ACCENT
        : '#ffffff'

    return {
        ...theme,
        onAccent,
    }
}

function normalizeHex(value: string | null | undefined) {
    if (!value) return null

    const trimmed = value.trim()
    const match = /^#?([0-9a-f]{6})$/i.exec(trimmed)
    if (!match) return null

    return `#${match[1].toUpperCase()}`
}

function hexToRgb(value: string): Rgb | null {
    const normalized = normalizeHex(value)
    if (!normalized) return null

    const hex = normalized.slice(1)
    return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
    }
}

function rgbToHex({ r, g, b }: Rgb) {
    return `#${[r, g, b]
        .map((value) => Math.round(value).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`
}

function rgbTriplet(value: string) {
    const rgb = hexToRgb(value) ?? { r: 0, g: 0, b: 0 }
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
    const red = r / 255
    const green = g / 255
    const blue = b / 255
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const delta = max - min
    const lightness = (max + min) / 2

    if (delta === 0) {
        return { h: 0, s: 0, l: lightness }
    }

    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    let hue = 0

    if (max === red) {
        hue = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
        hue = 60 * ((blue - red) / delta + 2)
    } else {
        hue = 60 * ((red - green) / delta + 4)
    }

    return {
        h: normalizeHue(hue),
        s: saturation,
        l: lightness,
    }
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
    const chroma = (1 - Math.abs(2 * l - 1)) * s
    const huePrime = h / 60
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1))
    const match = l - chroma / 2
    let rgb = { r: 0, g: 0, b: 0 }

    if (huePrime < 1) rgb = { r: chroma, g: x, b: 0 }
    else if (huePrime < 2) rgb = { r: x, g: chroma, b: 0 }
    else if (huePrime < 3) rgb = { r: 0, g: chroma, b: x }
    else if (huePrime < 4) rgb = { r: 0, g: x, b: chroma }
    else if (huePrime < 5) rgb = { r: x, g: 0, b: chroma }
    else rgb = { r: chroma, g: 0, b: x }

    return {
        r: clampByte((rgb.r + match) * 255),
        g: clampByte((rgb.g + match) * 255),
        b: clampByte((rgb.b + match) * 255),
    }
}

function hslWithLuminance(h: number, s: number, targetLuminance: number): Rgb {
    let low = 0
    let high = 1
    let best = hslToRgb({ h, s, l: 0.5 })

    for (let index = 0; index < 24; index += 1) {
        const mid = (low + high) / 2
        const rgb = hslToRgb({ h, s, l: mid })
        best = rgb

        if (relativeLuminance(rgb) < targetLuminance) {
            low = mid
        } else {
            high = mid
        }
    }

    return best
}

function relativeLuminance({ r, g, b }: Rgb) {
    const [red, green, blue] = [r, g, b].map((value) => {
        const channel = value / 255
        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function saturationMultiplier(hue: number) {
    return hue >= 18 && hue <= 70 ? 1.06 : 0.78
}

function adjustHue(hue: number) {
    if (hue >= 348) return normalizeHue(hue + 4)
    if (hue >= 42 && hue <= 72) return hue
    if (hue >= 192 && hue <= 204) return 192
    if (hue >= 205 && hue <= 216) return 224
    return hue
}

function circularDistance(left: number, right: number) {
    const diff = Math.abs(normalizeHue(left) - normalizeHue(right))
    return Math.min(diff, 360 - diff)
}

function normalizeHue(hue: number) {
    return ((hue % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function clampByte(value: number) {
    return Math.round(clamp(value, 0, 255))
}
