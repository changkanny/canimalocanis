import { Zen_Maru_Gothic } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';
import './global.css';

const font = Zen_Maru_Gothic({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700", "900"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="jp" data-bs-theme="dark">
            <body className={`${font.className}`}>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
