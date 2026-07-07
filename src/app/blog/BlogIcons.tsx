type IconProps = {
    size?: number;
};

export function HeartIcon({ size = 16 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7.4-4.6-10-9.1C.4 8.7 1.9 5.3 5.3 4.7c2.2-.4 4.1.9 5 2.6.9-1.7 2.8-3 5-2.6 3.4.6 4.9 4 3.3 7.2C19.4 16.4 12 21 12 21z" />
        </svg>
    );
}

export function EyeIcon({ size = 16 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export function CommentIcon({ size = 16 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M3 5h18v11H8l-5 4V5z" />
        </svg>
    );
}
