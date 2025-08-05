import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt, model = "V4", duration = 180 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt gerekli" }, { status: 400 });
    }

    console.log("🚀 API çağrısı başladı - Prompt:", prompt);

    // SunoAPI.org anahtarı - Yeni hesap (ege.kv.41.08@gmail.com)
    const SUNO_API_KEY = "c498d1ba4b20c98bf0d60ac14747cbbf";

    console.log("🎵 SunoAPI.org doğru endpoint'leri kullanılıyor...");
    console.log("🔑 API Key:", SUNO_API_KEY);
    console.log(
      "📡 Generate Endpoint:",
      "https://api.sunoapi.org/api/v1/generate"
    );
    console.log(
      "📡 Credits Endpoint:",
      "https://api.sunoapi.org/api/v1/generate/credit"
    );

    // Credits kontrolü
    try {
      const creditsResponse = await fetch(
        "https://api.sunoapi.org/api/v1/generate/credit",
        {
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        console.log("💰 Kalan Credits:", creditsData.data);

        if (creditsData.data < 1) {
          throw new Error("Yetersiz credits");
        }
      }
    } catch (creditsError) {
      console.error("❌ Credits hatası:", creditsError.message);
    }

    try {
      // Şarkı üretimi başlat
      console.log("🎵 Şarkı üretimi başlatılıyor...");

      const generateResponse = await fetch(
        "https://api.sunoapi.org/api/v1/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            model: "V4",
            customMode: false,
            instrumental: false,
            callBackUrl:
              "https://growup-flax.vercel.app/api/get-generated-song",
          }),
        }
      );

      console.log("📊 Generate yanıtı status:", generateResponse.status);

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("❌ Generate hatası:", errorText);
        throw new Error(
          `Generate hatası: ${generateResponse.status} - ${errorText}`
        );
      }

      const generateData = await generateResponse.json();
      console.log("✅ Generate başarılı! Yanıt:", generateData);

      // Task ID'sini al
      const taskId = generateData.data?.taskId || generateData.taskId;
      console.log("🎵 Task ID:", taskId);

      if (!taskId) {
        throw new Error("Task ID bulunamadı");
      }

      // Şarkının hazır olmasını bekle
      let audioUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 saniye bekle

      while (attempts < maxAttempts) {
        console.log(`⏳ Durum kontrolü ${attempts + 1}/${maxAttempts}...`);

        const statusResponse = await fetch(
          `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${SUNO_API_KEY}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log("📊 Şarkı durumu:", statusData);

          if (statusData.data?.status === "SUCCESS") {
            // Başarılı durumda audio URL'lerini al
            const tracks = statusData.data.response?.data || [];
            if (tracks.length > 0) {
              audioUrl = tracks[0].audio_url;
              console.log("🎵 Audio URL bulundu:", audioUrl);
              break;
            }
          } else if (statusData.data?.status === "FAILED") {
            throw new Error("Şarkı üretimi başarısız oldu");
          }
        } else {
          console.log("❌ Durum kontrolü hatası:", statusResponse.status);
        }

        // 1 saniye bekle
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!audioUrl) {
        throw new Error("Şarkı üretimi zaman aşımına uğradı");
      }

      // Dinamik şarkı sözleri üretimi
      const generateLyrics = (userPrompt) => {
        const themes = [
          "aşk",
          "ayrılık",
          "umut",
          "hüzün",
          "mutluluk",
          "öfke",
          "pişmanlık",
          "özlem",
          "rock",
          "pop",
          "rap",
          "folk",
          "jazz",
          "blues",
          "electronic",
          "country",
        ];

        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const lyricsTemplates = {
          aşk: `[Verse 1]
${userPrompt}
Seninle her an güzel
Kalbim seninle dolu
Seni düşünüyorum

[Chorus]
Seni seviyorum
Her gece rüyamda
Seni arıyorum
Kalbimde yaşıyorsun

[Verse 2]
${userPrompt}
Birlikte geçirdiğimiz anlar
Unutulmaz hatıralar
Seninle her şey güzel

[Bridge]
Sen benim her şeyimsin
Seninle tamamım
Seni seviyorum

[Chorus]
Seni seviyorum
Her gece rüyamda
Seni arıyorum
Kalbimde yaşıyorsun`,

          ayrılık: `[Verse 1]
${userPrompt}
Seni kaybettim
Kalbim paramparça
Yalnız kaldım

[Chorus]
Neden gittin
Neden bıraktın
Beni böyle yalnız
Kimsesiz zamanlarda

[Verse 2]
${userPrompt}
Hatıralar acıtıyor
Seni özlüyorum
Geri gel artık

[Bridge]
Bir gün geri dönersin
Umarım unutmazsın
Beni bekliyorum

[Chorus]
Neden gittin
Neden bıraktın
Beni böyle yalnız
Kimsesiz zamanlarda`,

          rock: `[Verse 1]
${userPrompt}
Gitar çalıyor
Ses yükseliyor
Rock ruhu yaşıyor

[Chorus]
ROCK AND ROLL!
Ses yükseliyor
Kalbim çarpıyor
Özgürlük yaşıyor

[Verse 2]
${userPrompt}
Drum beat çalıyor
Bass gümbürdüyor
Rock ruhu yaşıyor

[Solo]
Gitar solo
Özgürlük
Rock and roll

[Chorus]
ROCK AND ROLL!
Ses yükseliyor
Kalbim çarpıyor
Özgürlük yaşıyor`,

          rap: `[Verse 1]
${userPrompt}
Flow akıyor
Rhyme geliyor
Rap ruhu yaşıyor

[Hook]
Yeah yeah
Flow akıyor
Rhyme geliyor
Rap ruhu yaşıyor

[Verse 2]
${userPrompt}
Beat çalıyor
Söz akıyor
Rap ruhu yaşıyor

[Bridge]
Freestyle
Özgürlük
Rap ruhu

[Hook]
Yeah yeah
Flow akıyor
Rhyme geliyor
Rap ruhu yaşıyor`,

          electronic: `[Verse 1]
${userPrompt}
Synthesizer çalıyor
Electronic beat
Digital ruh yaşıyor

[Chorus]
ELECTRONIC!
Digital beat
Synthesizer
Electronic ruh

[Verse 2]
${userPrompt}
Bass drop geliyor
Electronic sound
Digital ruh yaşıyor

[Bridge]
Digital world
Electronic soul
Future sound

[Chorus]
ELECTRONIC!
Digital beat
Synthesizer
Electronic ruh`,
        };

        return lyricsTemplates[randomTheme] || lyricsTemplates.aşk;
      };

      const dynamicLyrics = generateLyrics(prompt);

      console.log("🎉 Başarılı! Gerçek AI şarkı üretildi");

      return NextResponse.json({
        success: true,
        title: `AI Şarkı - ${prompt.substring(0, 30)}...`,
        audio_url: audioUrl, // Gerçek SunoAPI.org'dan gelen ses
        lyrics: dynamicLyrics,
        duration: `${Math.floor(duration / 60)}:${(duration % 60)
          .toString()
          .padStart(2, "0")}`,
        model: model,
        prompt: prompt,
        is_demo: false,
        message: "SunoAPI.org ile gerçek şarkı başarıyla üretildi",
      });
    } catch (apiError) {
      console.error("❌ SunoAPI.org hatası:", apiError.message);
      console.error("❌ Hata detayı:", apiError.message);
      console.error("❌ Hata stack:", apiError.stack);

      // Bora Abi'nin basit fetch isteği
      console.log("🔄 Bora Abi'nin basit fetch isteği deneniyor...");

      const url = "https://api.sunoapi.org/api/v1/generate";
      const options = {
        method: "POST",
        headers: {
          Authorization: "Bearer c498d1ba4b20c98bf0d60ac14747cbbf",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customMode: false,
          prompt: prompt,
          instrumental: true,
          model: "V4",
          callBackUrl: "https://growup-flax.vercel.app/api/get-generated-song",
        }),
      };

      try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log("✅ Bora Abi'nin isteği başarılı:", data);

        // Kredi kontrolü
        if (data.code === 429) {
          console.error("❌ Yetersiz kredi:", data.msg);
          return NextResponse.json(
            {
              success: false,
              error: "Yetersiz kredi. Lütfen hesabınızı yükleyin.",
              message: data.msg,
            },
            { status: 429 }
          );
        }

        if (data.code !== 200) {
          console.error("❌ API hatası:", data.msg);
          return NextResponse.json(
            {
              success: false,
              error: data.msg,
              message: "API hatası oluştu",
            },
            { status: data.code }
          );
        }

        // Task ID varsa polling başlat
        if (data.code === 200 && data.data?.taskId) {
          console.log("🎵 Task ID alındı, polling başlatılıyor...");

          // Supabase'e kaydet
          try {
            const { supabase } = await import("../../../lib/supabaseClient");

            const { data: insertData, error } = await supabase
              .from("music_projects")
              .insert({
                title: `AI Şarkı - ${prompt.substring(0, 30)}...`,
                prompt: prompt,
                audio_url: null,
                lyrics: null,
                duration: null,
                model: model,
                status: "processing", // İşleniyor
                is_demo: false,
              })
              .select();

            if (error) {
              console.error("❌ Supabase kayıt hatası:", error);
            } else {
              console.log("✅ Supabase'e kaydedildi:", insertData);
            }
          } catch (dbError) {
            console.error("❌ Database hatası:", dbError);
          }

          return NextResponse.json({
            success: true,
            taskId: data.data.taskId,
            message: "Şarkı üretimi başladı, işleniyor...",
            status: "processing",
          });
        }

        return NextResponse.json({
          success: true,
          data: data,
          message: "Bora Abi'nin basit fetch isteği başarılı",
        });
      } catch (error) {
        console.error("❌ Bora Abi'nin isteği hatası:", error);

        // Son fallback - demo modu
        console.log("🎵 Demo şarkı üretiliyor...");

        return NextResponse.json({
          success: true,
          title: `Demo Şarkı - ${prompt.substring(0, 30)}...`,
          audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
          lyrics: `[Verse 1]\n${prompt}\n\n[Chorus]\nDemo şarkı\n\n[Verse 2]\n${prompt}`,
          duration: "3:30",
          model: model,
          prompt: prompt,
          is_demo: true,
          message: "Demo şarkı üretildi (son fallback)",
        });
      }
    }
  } catch (error) {
    console.error("💥 Şarkı üretimi hatası:", error);
    console.error("💥 Hata detayı:", error.message);
    console.error("💥 Hata stack:", error.stack);

    // Son fallback
    return NextResponse.json({
      success: true,
      title: `Demo Şarkı - ${prompt?.substring(0, 30) || "Bilinmeyen"}...`,
      audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      lyrics: `[Verse]\n${
        prompt || "Hata"
      }\n\n[Chorus]\nBu bir demo şarkı sözüdür\nGerçek AI söz üretimi için SunoAPI.org anahtarı gerekli\n\n[Verse 2]\n${
        prompt || "Hata"
      }\n\n[Chorus]\nBu bir demo şarkı sözüdür\nGerçek AI söz üretimi için SunoAPI.org anahtarı gerekli`,
      duration: "3:30",
      model: "V4",
      prompt: prompt || "Bilinmeyen",
      is_demo: true,
      message: "Demo şarkı üretildi (API hatası nedeniyle)",
    });
  }
}
