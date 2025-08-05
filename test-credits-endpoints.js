const SUNO_API_KEY = "fa3b8a79c7aa185d07298838f1106ad0";

async function testCreditsEndpoint() {
  console.log("🔍 Doğru credits endpoint'ini test ediyoruz...");

  try {
    console.log("📡 Testing: https://api.sunoapi.org/api/v1/generate/credit");

    const response = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
        },
      }
    );

    console.log(`📊 Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success:", JSON.stringify(data, null, 2));

      if (data.code === 200) {
        console.log("🎉 CREDITS ENDPOINT ÇALIŞIYOR!");
        console.log("💰 Kalan Credits:", data.data);
        console.log("📝 Mesaj:", data.msg);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Error:", errorText);
    }
  } catch (error) {
    console.log("💥 Network error:", error.message);
  }
}

testCreditsEndpoint();
