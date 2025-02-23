import { CustomizedTableBlock } from "@/lib/interface/block";
import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './table.module.css';

export function Table({ block }: { block: CustomizedTableBlock }): JSX.Element {

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                {block.table.head && (
                    <thead>
                        <tr>
                            {block.table.head.map((cell) => (
                                <th key={cell.id}>
                                    <RichText id={cell.id} blockList={cell.table_cell.rich_text} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {block.table.body.map((row) => (
                        <tr key={row.map((cell) => cell.id).join("-")}>
                            {row.map((cell, columnIndex) => {

                                if (block.table.has_row_header && columnIndex === 0) {

                                    return (
                                        <th key={cell.id}>
                                            <RichText id={cell.id} blockList={cell.table_cell.rich_text} />
                                        </th>
                                    );
                                } else {

                                    return (
                                        <td key={cell.id}>
                                            <RichText id={cell.id} blockList={cell.table_cell.rich_text} />
                                        </td>
                                    );
                                }
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );   
}