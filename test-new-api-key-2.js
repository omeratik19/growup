// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function testNewAPIKey2() {
  console.log("🧪 İkinci API Key Test Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

  try {
    // 1. API key doğrulama
    console.log("🔑 API key doğrulama...");
    const validateResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    console.log("📊 Validation status:", validateResponse.status);

    if (validateResponse.ok) {
      const validateData = await validateResponse.json();
      console.log("✅ API key geçerli:", validateData);

      // 2. Test üretimi
      console.log("\n🎵 Test üretimi...");
      const generateResponse = await fetch(
        "https://api.sunoapi.org/api/v1/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Test şarkısı - API key çalışıyor",
            model: "V4",
            customMode: false,
            instrumental: true,
            callBackUrl: "https://your-domain.com/api/test-callback",
          }),
        }
      );

      if (generateResponse.ok) {
        const generateData = await generateResponse.json();
        console.log("✅ Test üretimi başarılı:", generateData);
      } else {
        console.error("❌ Test üretimi hatası:", await generateResponse.text());
      }
    } else {
      console.error("❌ API key geçersiz:", await validateResponse.text());
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testNewAPIKey2();
