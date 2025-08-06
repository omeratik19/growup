// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const API_KEY = process.env.SUNO_API_KEY || "your_api_key_here";

async function checkCredits() {
  console.log("🔑 Credits Kontrolü Başlıyor...");

  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.log("⚠️ Lütfen .env.local dosyasında SUNO_API_KEY ayarlayın");
    return;
  }

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
      console.log("✅ Credits bilgisi:", data);
    } else {
      const errorText = await response.text();
      console.error("❌ Credits hatası:", errorText);
    }
  } catch (error) {
    console.error("💥 Hata:", error.message);
  }
}

checkCredits();
