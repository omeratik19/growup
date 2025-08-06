// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testNewAPIKey() {
  console.log("🧪 API Key Test Başlıyor...");

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

    console.log("📊 Credits response status:", creditsResponse.status);

    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log("✅ Credits yanıtı:", creditsData);
    } else {
      const errorText = await creditsResponse.text();
      console.error("❌ Credits hatası:", errorText);
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
          prompt: "Test şarkı",
          model: "V4",
          customMode: false,
          instrumental: true,
          callBackUrl: "https://your-domain.com/api/get-generated-song",
        }),
      }
    );

    console.log("📊 Generate response status:", generateResponse.status);

    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log("✅ Generate yanıtı:", generateData);
    } else {
      const errorText = await generateResponse.text();
      console.error("❌ Generate hatası:", errorText);
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testNewAPIKey();
