// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testCreditsEndpoints() {
  console.log("🧪 Credits Endpoints Test Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

  try {
    // 1. Credits endpoint
    console.log("🔑 Credits endpoint testi...");
    const creditsResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    console.log("📊 Credits status:", creditsResponse.status);

    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log("✅ Credits bilgisi:", creditsData);
    } else {
      console.error("❌ Credits hatası:", await creditsResponse.text());
    }

    // 2. Diğer endpoints test edilebilir
    console.log("\n📋 Diğer endpoints test edilebilir:");
    console.log("- /api/v1/generate");
    console.log("- /api/v1/generate/status/{id}");
    console.log("- /api/v1/generate/credit");
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testCreditsEndpoints();
