const API_KEY = "409a7f70e4d6f947fc6c0adcc83c681b";

async function testCheapGeneration() {
  console.log("🎵 Ucuz şarkı üretimi testi...");

  try {
    const response = await fetch("https://api.sunoapi.org/api/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Kısa test şarkı",
        model: "V3", // V4 yerine V3 (daha ucuz)
        customMode: false,
        instrumental: true,
        duration: 60, // 180 yerine 60 saniye
        callBackUrl: "https://growup-flax.vercel.app/api/get-generated-song",
      }),
    });

    console.log("📊 Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Generate yanıtı:", data);

      if (data.code === 200) {
        console.log("🎉 Şarkı üretimi başladı!");
        console.log("🔍 Task ID:", data.data?.taskId);
      } else {
        console.log("❌ API hatası:", data.msg);
      }
    } else {
      const errorText = await response.text();
      console.error("❌ Generate hatası:", errorText);
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testCheapGeneration();
