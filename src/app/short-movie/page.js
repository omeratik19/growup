"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShortMovie() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleCreateMovie = () => {
    if (!isLoggedIn) {
      alert("❌ Film oluşturmak için giriş yapmanız gerekiyor!");
      router.push("/login");
      return;
    }
    router.push("/short-movie/create");
  };

  const movies = [
    {
      id: 1,
      title: "Zaman Yolculuğu",
      description:
        "2050 yılında bir bilim insanının zaman makinesi icat etmesi ve geçmişe yolculuk yapması.",
      duration: "4:32",
      genre: "Bilim Kurgu",
      author: "AI_Creator",
      views: "2.4K",
      likes: "156",
    },
    {
      id: 2,
      title: "Apartman Aşkı",
      description:
        "Aynı apartmanda yaşayan iki yabancının tesadüfen tanışması ve aşık olması.",
      duration: "3:18",
      genre: "Romantik Komedi",
      author: "FilmMaker_Pro",
      views: "1.8K",
      likes: "89",
    },
    {
      id: 3,
      title: "Eski Evin Gizemi",
      description:
        "Eski bir evde yaşayan ailenin evin karanlık geçmişini keşfetmesi.",
      duration: "5:12",
      genre: "Korku",
      author: "HorrorMaster",
      views: "3.1K",
      likes: "234",
    },
    {
      id: 4,
      title: "Uzay Macerası",
      description:
        "Uzay istasyonunda yaşanan gizemli olayları araştıran astronotun hikayesi.",
      duration: "4:05",
      genre: "Bilim Kurgu",
      author: "SpaceExplorer",
      views: "1.9K",
      likes: "127",
    },
    {
      id: 5,
      title: "Şehir Gecesi",
      description:
        "Gece yarısı şehirde yaşanan romantik bir karşılaşma ve aşk hikayesi.",
      duration: "2:58",
      genre: "Romantik",
      author: "NightWriter",
      views: "2.7K",
      likes: "198",
    },
    {
      id: 6,
      title: "Siber Güvenlik",
      description:
        "Bir hacker'ın siber dünyada yaşadığı tehlikeli macera ve aksiyon.",
      duration: "3:45",
      genre: "Aksiyon",
      author: "CyberHero",
      views: "2.1K",
      likes: "145",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
          padding: "20px 0",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            <span style={{ fontSize: "28px" }}>🎬</span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #00d4ff, #0099cc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ShortMovie
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleCreateMovie}
              style={{
                background: "linear-gradient(135deg, #00d4ff, #0099cc)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0,212,255,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              🎬 Film Oluştur
            </button>

            <button
              onClick={() => router.push("/")}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            >
              Ana Sayfa
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          paddingTop: "100px",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 20px 40px",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "60px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "20px",
              background: "linear-gradient(135deg, #00d4ff, #ff00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI ile Film Yarat
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#cccccc",
              marginBottom: "40px",
              maxWidth: "600px",
              margin: "0 auto 40px",
            }}
          >
            Topluluk tarafından oluşturulan kısa filmleri keşfet ve izle
          </p>
        </div>

        {/* Content */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#00d4ff",
              }}
            >
              Topluluk Filmleri
            </h2>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🔥 Popüler
              </button>
              <button
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ⭐ Yeni
              </button>
            </div>
          </div>

          {/* Movies Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {movies.map((movie) => (
              <div
                key={movie.id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,212,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    height: "180px",
                    background: "linear-gradient(135deg, #00d4ff, #ff00ff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    position: "relative",
                  }}
                >
                  🎬
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {movie.genre}
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "#fff",
                    }}
                  >
                    {movie.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#cccccc",
                      marginBottom: "12px",
                      lineHeight: "1.4",
                    }}
                  >
                    {movie.description}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      👤 {movie.author}
                    </span>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      ⏱️ {movie.duration}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#888",
                      }}
                    >
                      <span>👁️ {movie.views}</span>
                      <span>❤️ {movie.likes}</span>
                    </div>
                    <button
                      style={{
                        background: "linear-gradient(135deg, #00d4ff, #0099cc)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      İzle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "rgba(0,0,0,0.8)",
          padding: "40px 0",
          marginTop: "80px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            textAlign: "center",
            color: "#888",
          }}
        >
          <p>© 2024 ShortMovie - AI ile Film Yaratma Platformu</p>
        </div>
      </footer>
    </div>
  );
}
