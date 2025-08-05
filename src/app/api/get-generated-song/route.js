import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("🎵 Suno callback alındı!");

    const body = await request.json();
    console.log("📊 Callback body:", JSON.stringify(body, null, 2));

    // Suno'dan gelen veriyi işle
    const { taskId, status, data } = body;

    console.log("🔍 Task ID:", taskId);
    console.log("🔍 Status:", status);
    console.log("🔍 Data:", data);

    if (status === "SUCCESS" && data) {
      console.log("✅ Şarkı başarıyla üretildi!");

      // Suno'dan gelen track'leri al
      let tracks = [];
      
      if (Array.isArray(data)) {
        tracks = data;
      } else if (data.tracks) {
        tracks = data.tracks;
      } else if (data.data) {
        tracks = Array.isArray(data.data) ? data.data : [data.data];
      } else {
        tracks = [data];
      }

      console.log("🎵 Bulunan tracks:", tracks.length);

      if (tracks.length > 0) {
        // İlk track'in bilgilerini al
        const firstTrack = tracks[0];
        const audioUrl = firstTrack.audio_url || firstTrack.url || firstTrack.audioUrl;
        const title = firstTrack.title || firstTrack.name || "Üretilen Şarkı";
        const duration = firstTrack.duration || "3:30";

        console.log("🎵 Audio URL:", audioUrl);
        console.log("🎵 Title:", title);
        console.log("🎵 Duration:", duration);

        // Supabase'e kaydet
        try {
          const { supabase } = await import("../../../lib/supabaseClient");
          
          const { data: insertData, error } = await supabase
            .from("music_projects")
            .insert({
              title: title,
              prompt: "Suno AI ile üretildi",
              audio_url: audioUrl,
              lyrics: `[Verse]\nSuno AI ile üretilen şarkı\n\n[Chorus]\n${title}\n\n[Verse 2]\nAI müzik üretimi`,
              duration: duration,
              model: "V4",
              status: "completed",
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
          message: "Şarkı başarıyla üretildi ve kaydedildi",
          taskId: taskId,
          audioUrl: audioUrl,
          title: title,
          duration: duration,
          tracks: tracks,
          totalTracks: tracks.length,
        });
      }
    } else if (status === "FAILED") {
      console.error("❌ Şarkı üretimi başarısız oldu");
      return NextResponse.json(
        {
          success: false,
          message: "Şarkı üretimi başarısız",
          taskId: taskId,
          error: data?.errorMessage || "Bilinmeyen hata",
        },
        { status: 400 }
      );
    } else if (status === "PROCESSING") {
      console.log("⏳ Şarkı hala işleniyor...");
      return NextResponse.json({
        success: true,
        message: "Şarkı işleniyor",
        taskId: taskId,
        status: status,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Callback alındı",
      taskId: taskId,
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
    message: "Get Generated Song callback endpoint aktif",
    status: "ready",
    endpoint: "/api/get-generated-song",
  });
} 