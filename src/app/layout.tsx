import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AudioPlayerController from "../components/AudioPlayerController";
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
                <AudioPlayerController />
                <Header />

                <div className="content-layout">
                    <main className="page-content">{children}</main>
                </div>

                <Footer />
            </body>
        </html>
    );
}
