const NEW_API_KEY = "c498d1ba4b20c98bf0d60ac14747cbbf";

async function testNewAPIKey2() {
  console.log("🧪 Yeni API Key Test Başlıyor...");

  try {
    // 1. Credits kontrolü
    console.log("🔑 Credits kontrolü...");
    const creditsResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${NEW_API_KEY}`,
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
          Authorization: `Bearer ${NEW_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Test şarkı",
          model: "V4",
          customMode: false,
          instrumental: true,
          duration: 60, // Kısa süre
          callBackUrl: "https://growup-flax.vercel.app/api/get-generated-song",
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

testNewAPIKey2();
