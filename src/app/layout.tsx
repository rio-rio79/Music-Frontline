import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AudioPlayerController from "../components/AudioPlayerController";
import LikeInitializer from "../components/LikeInitializer";
import { getFavoriteColorCssVariables } from "@/lib/favorite-color";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { CSSProperties } from "react";

async function getInitialFavoriteColor() {
    const supabase = await createSupabaseServer()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('color_code')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Failed to fetch favorite color:', error)
        return null
    }

    return data?.color_code ?? null
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const initialFavoriteColor = await getInitialFavoriteColor()
    const favoriteThemeStyle = getFavoriteColorCssVariables(initialFavoriteColor) as CSSProperties

    return (
        <html lang="ja" style={favoriteThemeStyle}>
            <body>
                <LikeInitializer />
                <AudioPlayerController />
                <Header initialFavoriteColor={initialFavoriteColor} />

                <div className="content-layout">
                    <main className="page-content">{children}</main>
                </div>

                <Footer />
            </body>
        </html>
    );
}
