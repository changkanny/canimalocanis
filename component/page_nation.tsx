
import { MaterialSymbolsArrowBackIosNewRounded, MaterialSymbolsArrowForwardIosRounded } from "./icon";
import styles from "./page_nation.module.css";

interface PageNationProps {
    
    /// 現在のページ
    currentPage: number;

    /// 総ページ数
    totalPages: number;
}

export default function PageNation({ currentPage, totalPages }: PageNationProps) {

    return (
        <div className="d-flex justify-content-center">
            <nav className="d-flex align-items-center">
                <a 
                    aria-label="前へ"
                    className={`${styles.button} ${currentPage === 1 ? styles.disabled : ""}`}
                    href={currentPage === 1 ? undefined : `?page=${currentPage - 1}`}
                >
                    <MaterialSymbolsArrowBackIosNewRounded className="w-50 h-50" />
                </a>
                <span className="mx-4 d-flex align-items-center">
                    <span className="fw-bold">{currentPage}</span>
                    <span className="text-muted mx-2">/</span>
                    <span className="text-muted">{totalPages}</span>
                </span>
                <a
                    aria-label="次へ"
                    className={`${styles.button} ${currentPage === totalPages ? styles.disabled : ""}`}
                    href={currentPage === totalPages ? undefined : `?page=${currentPage + 1}`}
                >
                    <MaterialSymbolsArrowForwardIosRounded className="w-50 h-50" />
                </a>
            </nav>
        </div>
    );
};