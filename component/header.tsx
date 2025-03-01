import { Geologica } from "next/font/google";
import styles from "./header.module.css";

const font = Geologica({
  subsets: ["latin"],
  weight: ["800"],
});

export default function Header() {

  return (
    <header className="navbar navbar-expand-lg">
      <p className={`navbar-brand ${font.className}`}>
        <a href="/" className={styles.title}>Canimalocanis</a>
      </p>
    </header>
  );
}