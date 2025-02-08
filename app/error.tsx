"use client"
import Footer from "@/component/footer";
import Header from "@/component/header";
import Image from 'next/image';

export default function ErrorPage() {
    return (
        <div>
            <title>Server Error | Canimalocanis</title>
            <Header />
            <main>
                <div className="text-center my-5">
                    <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
                        <Image src="/500.png" alt="500 Internal Server Error" layout="fill" objectFit="contain" />
                    </div>
                    <span>一時的に表示できません</span><br />
                    <span>たぶんおれが書いたコードのせいでバグっています</span>
                </div>
            </main>
            <Footer />
        </div>
    );
}; 
