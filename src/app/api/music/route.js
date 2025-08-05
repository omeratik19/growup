import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("🎵 Suno callback alındı!");

    const body = await request.json();
    console.log("📊 Callback body:", JSON.stringify(body, null, 2));

    // Suno'dan gelen veriyi işle
    const { taskId, status, data } = body;

    if (status === "SUCCESS") {
      console.log("✅ Şarkı başarıyla üretildi!");

      // Audio URL'lerini al
      const tracks = data?.data || [];
      if (tracks.length > 0) {
        const audioUrl = tracks[0].audio_url;
        console.log("🎵 Audio URL:", audioUrl);

        // Burada veritabanına kaydedebilir veya başka işlemler yapabilirsiniz
        // Örneğin: await saveToDatabase(taskId, audioUrl, tracks);

        return NextResponse.json({
          success: true,
          message: "Callback başarıyla işlendi",
          audioUrl: audioUrl,
          tracks: tracks,
        });
      }
    } else if (status === "FAILED") {
      console.error("❌ Şarkı üretimi başarısız oldu");
      return NextResponse.json(
        {
          success: false,
          message: "Şarkı üretimi başarısız",
          error: data?.errorMessage || "Bilinmeyen hata",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Callback alındı",
      status: status,
    });
  } catch (error) {
    console.error("💥 Callback işleme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Callback işleme hatası",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return NextResponse.json({
    message: "Music callback endpoint aktif",
    status: "ready",
  });
}
