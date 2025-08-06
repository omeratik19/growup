"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMovie() {
  const router = useRouter();
  const [chatMessage, setChatMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateMovie = async () => {
    if (!chatMessage.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ ${data.message}\n\nFilm: ${data.data.title}\nSüre: ${data.data.duration}`
        );
        setChatMessage("");
      } else {
        alert("❌ Film oluşturulurken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Film oluşturma hatası:", error);
      alert("❌ Film oluşturulurken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

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
            onClick={() => router.push("/short-movie")}
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
              Film Oluştur
            </span>
          </div>

          <button
            onClick={() => router.push("/short-movie")}
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
            ← Geri Dön
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          paddingTop: "100px",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "100px 20px 40px",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "20px",
              background: "linear-gradient(135deg, #00d4ff, #ff00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Gemini AI ile Film Oluştur
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#cccccc",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Hayal ettiğin filmi AI ile gerçeğe dönüştür
          </p>
        </div>

        {/* Film Creation Form */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "16px",
            padding: "40px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#00d4ff",
              }}
            >
              Film Senaryonuz:
            </label>
            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Film senaryonuzu buraya yazın... Örnek: 'Bir bilim kurgu filmi oluştur, uzayda geçen bir macera. Ana karakter bir astronot ve uzay istasyonunda yaşanan gizemli olayları araştırıyor.'"
              style={{
                width: "100%",
                minHeight: "150px",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "16px",
                color: "#fff",
                fontSize: "16px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            onClick={handleCreateMovie}
            disabled={isGenerating || !chatMessage.trim()}
            style={{
              background: isGenerating
                ? "rgba(255,255,255,0.2)"
                : "linear-gradient(135deg, #00d4ff, #0099cc)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isGenerating ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isGenerating || !chatMessage.trim() ? 0.6 : 1,
              width: "100%",
              marginBottom: "20px",
            }}
          >
            {isGenerating ? "🎬 Film Oluşturuluyor..." : "🎬 Film Oluştur"}
          </button>

          <div
            style={{
              padding: "20px",
              background: "rgba(0,212,255,0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <h3 style={{ color: "#00d4ff", marginBottom: "15px" }}>
              💡 Film Oluşturma İpuçları:
            </h3>
            <ul style={{ color: "#cccccc", lineHeight: "1.6" }}>
              <li>
                <strong>Detaylı senaryo yazın:</strong> Karakterler, mekan,
                olaylar
              </li>
              <li>
                <strong>Film türünü belirtin:</strong> Aksiyon, romantik,
                komedi, korku, vb.
              </li>
              <li>
                <strong>Atmosfer tanımlayın:</strong> Gece/gündüz, hava durumu,
                ruh hali
              </li>
              <li>
                <strong>Karakter detayları:</strong> Yaş, meslek, kişilik
                özellikleri
              </li>
              <li>
                <strong>Özel efektler:</strong> Özel efektler, müzik,
                ışıklandırma
              </li>
            </ul>
          </div>
        </div>

        {/* Examples */}
        <div
          style={{
            marginTop: "40px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            padding: "30px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#00d4ff",
            }}
          >
            🎭 Örnek Senaryolar:
          </h3>
          <div style={{ display: "grid", gap: "15px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              onClick={() =>
                setChatMessage(
                  "Bir bilim kurgu filmi oluştur. 2050 yılında, bir genç bilim insanı zaman makinesi icat ediyor. İlk denemesinde geçmişe gidiyor ve tarihi değiştirmeye çalışıyor. Aksiyon dolu, heyecan verici bir macera."
                )
              }
            >
              <strong style={{ color: "#00d4ff" }}>🚀 Bilim Kurgu:</strong>
              <p
                style={{ color: "#cccccc", marginTop: "5px", fontSize: "14px" }}
              >
                2050 yılında zaman makinesi icat eden bir bilim insanının
                macerası
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              onClick={() =>
                setChatMessage(
                  "Bir romantik komedi filmi oluştur. İki yabancı aynı apartmanda yaşıyor ve tesadüfen tanışıyor. Başlangıçta birbirlerinden hoşlanmıyorlar ama zamanla aşık oluyorlar. Eğlenceli diyaloglar ve romantik sahneler."
                )
              }
            >
              <strong style={{ color: "#ff69b4" }}>💕 Romantik Komedi:</strong>
              <p
                style={{ color: "#cccccc", marginTop: "5px", fontSize: "14px" }}
              >
                Aynı apartmanda yaşayan iki yabancının aşk hikayesi
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              onClick={() =>
                setChatMessage(
                  "Bir korku filmi oluştur. Eski bir evde yaşayan bir aile, evin gizemli geçmişini keşfediyor. Gece yarısı garip sesler duyuyorlar ve evin her odasında farklı korkunç olaylar yaşanıyor. Gerilim dolu atmosfer."
                )
              }
            >
              <strong style={{ color: "#ff4444" }}>👻 Korku:</strong>
              <p
                style={{ color: "#cccccc", marginTop: "5px", fontSize: "14px" }}
              >
                Eski evde yaşanan gizemli ve korkunç olaylar
              </p>
            </div>
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
