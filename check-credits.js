const API_KEY = "409a7f70e4d6f947fc6c0adcc83c681b";

async function checkCredits() {
  console.log("🔑 Kredi kontrolü başlıyor...");

  try {
    const response = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    console.log("📊 Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Kredi durumu:", data);

      if (data.data && data.data > 0) {
        console.log(`💰 Kalan kredi: ${data.data}`);
        console.log("✅ Şarkı üretimi için yeterli kredi var");
      } else {
        console.log("❌ Yetersiz kredi!");
      }
    } else {
      const errorText = await response.text();
      console.error("❌ Kredi kontrolü hatası:", errorText);
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

checkCredits();
