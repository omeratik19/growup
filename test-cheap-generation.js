// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testCheapGeneration() {
  console.log("🧪 Cheap Generation Test Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

  try {
    // Ucuz şarkı üretimi testi (daha az credit kullanır)
    console.log("💰 Ucuz şarkı üretimi...");
    const generateResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Basit bir melodi",
          model: "V3", // Daha eski model, daha ucuz
          customMode: false,
          instrumental: true, // Sadece enstrümental
          duration: 15, // Kısa süre
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

testCheapGeneration();
