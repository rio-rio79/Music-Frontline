import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GlobalPlayer from "../components/GlobalPlayer";
import LikeInitializer from "../components/LikeInitializer";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body>
                <LikeInitializer />
                <Header />

                <div className="content-layout">
                    <main className="page-content">{children}</main>
                    <aside className="player-dock" aria-label="再生プレイヤー">
                        <GlobalPlayer />
                    </aside>
                </div>

                <Footer />
            </body>
        </html>
    );
}
