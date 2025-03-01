import styles from './footer.module.css';

export default function Footer() {

    return (
        <footer className={styles.footer}>
            <a href="/privacy-policy">プライバシーポリシー／免責事項</a>
            <p>© Canimalocanis</p>
        </footer>
    );
}