export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h1>Growup'a Hoş Geldin!</h1>
      <p>
        Devam etmek için{" "}
        <a href="/login" style={{ color: "#7c3aed" }}>
          Giriş Yap / Kayıt Ol
        </a>
      </p>
    </div>
  );
}
