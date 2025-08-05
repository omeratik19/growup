const SUNO_API_KEY = "fa3b8a79c7aa185d07298838f1106ad0";

async function testSunoAPI() {
  console.log("🧪 Suno API Test Başlıyor...");

  try {
    // 1. Credits kontrolü
    console.log("🔑 Credits kontrolü...");
    const creditsResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate/credit",
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
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

    // 2. Generate test - güncellenmiş parametrelerle
    console.log("\n🎵 Generate test...");
    const generateResponse = await fetch(
      "https://api.sunoapi.org/api/v1/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Test şarkı",
          model: "V4_5",
          customMode: false,
          instrumental: false,
          callBackUrl: "https://growup-flax.vercel.app/api/get-generated-song",
          style: "",
          title: "",
          negativeTags: "",
        }),
      }
    );

    console.log("📊 Generate response status:", generateResponse.status);

    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log("✅ Generate yanıtı:", generateData);

      // 3. Status kontrolü
      if (generateData.data?.taskId) {
        console.log("\n⏳ Status kontrolü...");
        const taskId = generateData.data.taskId;

        // 30 saniye bekle ve durumu kontrol et
        for (let i = 0; i < 6; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const statusResponse = await fetch(
            `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`,
            {
              headers: {
                Authorization: `Bearer ${SUNO_API_KEY}`,
              },
            }
          );

          console.log(`📊 Status check ${i + 1}/6: ${statusResponse.status}`);

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log("📊 Status data:", statusData);

            if (statusData.data?.status === "SUCCESS") {
              console.log("✅ Şarkı başarıyla üretildi!");
              break;
            } else if (statusData.data?.status === "FAILED") {
              console.log("❌ Şarkı üretimi başarısız!");
              break;
            }
          }
        }
      }
    } else {
      const errorText = await generateResponse.text();
      console.error("❌ Generate hatası:", errorText);
    }
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testSunoAPI();
