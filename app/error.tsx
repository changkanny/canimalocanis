"use client"
import Image from 'next/image';

export default function ErrorPage() {
    return (
        <div>
            <title>Server Error | Canimalocanis</title>
            <main>
                <div className="text-center my-5">
                    <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
                        <Image src="/500.png" alt="500 Internal Server Error" layout="fill" objectFit="contain" />
                    </div>
                    <span>ページを表示できませんでした</span><br />
                </div>
            </main>
        </div>
    );
}; 
