"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "48px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "32px" }}>🌱</span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#7c3aed",
            }}
          >
            Growhub
          </span>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#374151",
            marginBottom: "16px",
          }}
        >
          Projelerini Paylaş, Büyü!
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "32px",
            lineHeight: "1.6",
          }}
        >
          Geliştiriciler için modern proje paylaşım platformu. Projelerini
          paylaş, diğer geliştiricilerle bağlantı kur, yeni teknolojiler keşfet.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#6d28d9";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#7c3aed";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            🚀 Hemen Başla
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "transparent",
              color: "#7c3aed",
              border: "2px solid #7c3aed",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f3e8ff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            📊 Dashboard'a Git
          </button>
        </div>

        {/* Features */}
        <div
          style={{
            marginTop: "48px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>💻</div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Proje Paylaşımı
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Projelerini paylaş, geri bildirim al
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🤝</div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Topluluk
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Diğer geliştiricilerle bağlantı kur
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🚀</div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Keşfet
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Yeni teknolojiler ve projeler keşfet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
