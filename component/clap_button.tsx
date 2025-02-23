"use client";
import { JSX, useEffect, useState } from "react";
import styles from './clap_button.module.css';
import { ClappingHandsColorDefault } from "./icon";

export function ClapButton({ pageId } : { pageId: string }): JSX.Element {

    const [count, setCount] = useState<number | null>(null);
    const [highlight, setHighlight] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(false);

    useEffect(() => {

        const fetchCount = async () => {

            const response = await fetch(`/api/clap?id=${pageId}`, {method: "GET"});

            if (response.ok) {

                const data = await response.json();
                setCount(data.count);
            }
        };

        fetchCount();
    }, []);

    const onClick = async () => {

        if (count == null) {

            return;
        }

        setDisabled(true);

        const response = await fetch(`/api/clap?id=${pageId}`, {method: "POST"});

        if (response.ok) {

            const data = await response.json();
            setCount(data.count);
            setHighlight(true);
            setDisabled(false);
        } else {

            setDisabled(false);
        }
    };

    useEffect(() => {

        if (highlight) {

            const timer = setTimeout(() => {

                setHighlight(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [highlight]);

    return (
        <>
            {count !== null && (
                <div className={styles.container}>
                    <button className={styles.button} onClick={onClick} disabled={disabled}>
                        <ClappingHandsColorDefault className={styles.icon} />
                    </button>
                    <div className={`${styles.count} ${highlight ? styles.highlight : ''}`}>
                        {count}
                    </div>
                </div>
            )}
        </>
    );
}