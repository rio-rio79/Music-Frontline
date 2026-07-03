// 楽曲のサムネイル
export function ThmbSvg() {
    return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path 
                    d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"
                    stroke="#E8A0C0" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
            </svg>
    );
}

// 停止ボタン
export function StopMusic({color = "#E8447A"}) { 
    return(
        <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
            <rect x="4" y="4" width="4" height="16" rx="1" />
            <rect x="16" y="4" width="4" height="16" rx="1" />
        </svg>
    );
 }

// 再生ボタン
export function StartMusic({ color = "#E8447A" }) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
            <polygon points="4,2 18,10 4,18"/>
        </svg>
    ); 
}

// 前の楽曲
export function SkipBack() {
    return(
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="#555" strokeWidth="2">
            <rect x="0" y="2" width="3" height="20" rx="1.5" fill="#555" stroke="none" />
            <polygon points="28,2 10,12 28,22" fill="#555" stroke="none" />
        </svg>
    ); 
 }

// 次の楽曲
export function SkipForward(){
    return(
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
            <rect x="27" y="2" width="3" height="20" rx="1.5" fill="#555" stroke="none" />
            <polygon points="2,2 20,12 2,22" fill="#555" stroke="none" />
        </svg>
    )
}

// いいねボタン
export function Heart({ color = "#E8447A", filled = false }: { color?: string; filled?: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 22 22" fill={filled ? color : "none"} stroke={color} strokeWidth="1.8">
            <path d="M11 19.5S3 14.5 3 8.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 6-8 11-8 11z" />
        </svg>
    );
}

// 再生数表示用アイコン
export function GraySmallPlayMusic() { 
    return(
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#bbb" strokeWidth="1.5">
            <polygon points="4,2 14,8 4,14" />
        </svg>
    );

 }

//  いいね数表示用アイコン
export function GraySmallHeart({ color = "#bbb", filled = false }: { color?: string; filled?: boolean }) { 
    return(
        <svg width="14" height="14" viewBox="0 0 22 22" fill={filled ? color : "none"} stroke={color} strokeWidth="1.5">
            <path d="M11 19.5S3 14.5 3 8.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 6-8 11-8 11z" />
        </svg>
    );

 }

// 楽曲一覧用アイコン
export function CdSvg({ color = "#E8447A" }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1" fill={color} />
        </svg>
    );
}

// マイページ用アイコン
export function PersonSvg({ color = "#E8447A" }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
            <path
                d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

// やじるし
export function YajirushiSvg(){
    return(
            <svg
            //   className="blog-list__chevron"
                width="20px"
                height="20px"
                color="#ccc"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
    )
}

// 2人アイコン。フォローなどで使用
export function TwoPersonIcon(){
    return(
            // <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="9" cy="7" r="3"/>
                    <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/>
                <circle cx="17" cy="8" r="2.4"/>
                <path d="M15 13.3c2.4.2 4 1.9 4 4.2"/>
            </svg>
    )
}

// ペンアイコン
export function Pen(){
    return(
            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 19l1.2-4L16 4.2c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8L9 18.8 4 19z"/>
            </svg>
    )
}

// 音符アイコン
export function MusicalNote(){
    return(
            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M9 18V5l11-2v13"/>
                <circle cx="6" cy="18" r="2.4"/>
                <circle cx="17" cy="16" r="2.4"/>
            </svg>
    )
}