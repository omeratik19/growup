// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testSunoAPI() {
  console.log("🧪 Suno API Test Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

  try {
    // 1. Credits kontrolü
    console.log("🔑 Credits kontrolü...");
    const creditsResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log("✅ Credits:", creditsData);
    } else {
      console.error("❌ Credits hatası:", await creditsResponse.text());
      return;
    }

    // 2. Generate test
    console.log("\n🎵 Generate test...");
    const generateResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Güzel bir Türkçe şarkı",
          model: "V4",
          customMode: false,
          instrumental: false,
          callBackUrl: "https://your-domain.com/api/callback",
        }),
      }
    );

    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log("✅ Generate yanıtı:", generateData);

      // 3. Status kontrolü
      if (generateData.id) {
        console.log("\n📊 Status kontrolü...");
        const statusResponse = await fetch(
          `https://api.sunoapi.org/api/v1/generate/status/${generateData.id}`,
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log("✅ Status:", statusData);
        } else {
          console.error("❌ Status hatası:", await statusResponse.text());
        }
      }
    } else {
      console.error("❌ Generate hatası:", await generateResponse.text());
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testSunoAPI();
