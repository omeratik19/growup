// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testShortGeneration() {
  console.log("🧪 Short Generation Test Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

  try {
    // Kısa şarkı üretimi testi
    console.log("🎵 Kısa şarkı üretimi...");
    const generateResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Kısa ve güzel bir şarkı",
          model: "V4",
          customMode: false,
          instrumental: false,
          duration: 30, // 30 saniye
          callBackUrl: "https://your-domain.com/api/callback",
        }),
      }
    );

    console.log("📊 Generate status:", generateResponse.status);

    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log("✅ Generate yanıtı:", generateData);
    } else {
      console.error("❌ Generate hatası:", await generateResponse.text());
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testShortGeneration();
