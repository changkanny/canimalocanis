
import { MaterialSymbolsArrowBackIosNewRounded, MaterialSymbolsArrowForwardIosRounded } from "./icon";
import styles from "./page_nation.module.css";

export interface PageNationProps {
    
    index: number;
    totalPage: number;
    previousLink: string | null;
    nextLink: string | null;
}

export default function PageNation({ index, totalPage, previousLink: previous, nextLink: next }: PageNationProps) {

    const isDisabledPrevious = index <= 1;
    const isDisabledNext = index >= totalPage;

    return (
        <div className="d-flex justify-content-center">
            <nav className="d-flex align-items-center">
                <a 
                    aria-label="前へ"
                    className={`${styles.button} ${isDisabledPrevious ? styles.disabled : ""}`}
                    href={isDisabledPrevious ? undefined : previous || undefined}
                >
                    <MaterialSymbolsArrowBackIosNewRounded className="w-50 h-50" />
                </a>
                <span className="mx-4 d-flex align-items-center">
                    <span className="fw-bold">{index}</span>
                    <span className="text-muted mx-2">/</span>
                    <span className="text-muted">{totalPage}</span>
                </span>
                <a
                    aria-label="次へ"
                    className={`${styles.button} ${isDisabledNext ? styles.disabled : ""}`}
                    href={isDisabledNext ? undefined : next || undefined}
                >
                    <MaterialSymbolsArrowForwardIosRounded className="w-50 h-50" />
                </a>
            </nav>
        </div>
    );
};