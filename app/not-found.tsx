import Footer from "@/component/footer";
import Header from "@/component/header";
import Image from 'next/image';

export default function NotFound() {
    return (
        <div>
            <title>Not Found | Canimalocanis</title>
            <Header />
            <main>
                <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
                    <Image src="/404.png" alt="404 Not Found" layout="fill" objectFit="contain" />
                </div>
                <div className="text-center my-5">
                    <span>お探しのページは存在しません</span>
                </div>
            </main>
            <Footer />
        </div>
    );
}; 
