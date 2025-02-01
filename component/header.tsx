import { Geologica } from "next/font/google";

const font = Geologica({
  subsets: ["latin"],
  weight: ["800"],
});

export default function Header() {

  return (
    <header className="navbar navbar-expand-lg">
      <p className={`navbar-brand fs-1 fw-bold ${font.className}`}>
        <a href="/" className="text-decoration-none text-white">Canimalocanis</a>
      </p>
    </header>
  );
}