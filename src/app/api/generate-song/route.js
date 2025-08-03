import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt, model = "v4", duration = 180 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt gerekli" }, { status: 400 });
    }

    // Gelişmiş demo modu (gerçek API key'ler olmadan)
    console.log("🎵 Gelişmiş Demo Modu - Şarkı üretimi başlatılıyor...");

    // Simüle edilmiş işlem süresi
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Dinamik şarkı sözleri üretimi (geliştirilmiş)
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

        pop: `[Verse 1]
${userPrompt}
Pop beat çalıyor
Melodi akıyor
Pop ruhu yaşıyor

[Chorus]
POP MUSIC!
Melodi akıyor
Beat çalıyor
Pop ruhu yaşıyor

[Verse 2]
${userPrompt}
Hook geliyor
Pop sound
Pop ruhu yaşıyor

[Bridge]
Pop world
Pop soul
Pop music

[Chorus]
POP MUSIC!
Melodi akıyor
Beat çalıyor
Pop ruhu yaşıyor`,

        jazz: `[Verse 1]
${userPrompt}
Saxophone çalıyor
Jazz beat
Jazz ruhu yaşıyor

[Chorus]
JAZZ!
Smooth beat
Saxophone
Jazz ruhu yaşıyor

[Verse 2]
${userPrompt}
Piano çalıyor
Jazz sound
Jazz ruhu yaşıyor

[Bridge]
Jazz world
Jazz soul
Smooth jazz

[Chorus]
JAZZ!
Smooth beat
Saxophone
Jazz ruhu yaşıyor`,
      };

      return lyricsTemplates[randomTheme] || lyricsTemplates.aşk;
    };

    const dynamicLyrics = generateLyrics(prompt);

    // Farklı demo ses dosyaları
    const demoAudioUrls = [
      "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      "https://www.soundjay.com/misc/sounds/bell-ringing-04.wav",
      "https://www.soundjay.com/misc/sounds/bell-ringing-03.wav",
      "https://www.soundjay.com/misc/sounds/bell-ringing-02.wav",
      "https://www.soundjay.com/misc/sounds/bell-ringing-01.wav",
    ];

    const randomAudioUrl =
      demoAudioUrls[Math.floor(Math.random() * demoAudioUrls.length)];

    return NextResponse.json({
      success: true,
      title: `AI Şarkı - ${prompt.substring(0, 30)}...`,
      audio_url: randomAudioUrl, // Rastgele demo ses
      lyrics: dynamicLyrics,
      duration: `${Math.floor(duration / 60)}:${(duration % 60)
        .toString()
        .padStart(2, "0")}`,
      model: model,
      prompt: prompt,
      is_demo: true,
      message:
        "Gelişmiş demo şarkı başarıyla üretildi (Gerçek API key'ler için Replicate/ElevenLabs hesabı gerekli)",
    });
  } catch (error) {
    console.error("Şarkı üretimi hatası:", error);

    // Son fallback
    return NextResponse.json({
      success: true,
      title: `Demo Şarkı - ${prompt.substring(0, 30)}...`,
      audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      lyrics: `[Verse]\n${prompt}\n\n[Chorus]\nBu bir demo şarkı sözüdür\nGerçek AI söz üretimi için API anahtarı gerekli\n\n[Verse 2]\n${prompt}\n\n[Chorus]\nBu bir demo şarkı sözüdür\nGerçek AI söz üretimi için API anahtarı gerekli`,
      duration: "3:30",
      model: "v4",
      prompt: prompt,
      is_demo: true,
      message: "Demo şarkı üretildi (API hatası nedeniyle)",
    });
  }
}
