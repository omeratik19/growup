import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

    // TODO: Gemini API entegrasyonu burada yapılacak
    // Şu anda placeholder response döndürüyoruz

    const geminiResponse = {
      success: true,
      message:
        "Film senaryonuz alındı! Gemini API entegrasyonu yakında gelecek.",
      data: {
        title: "AI ile Oluşturulan Film",
        description: message,
        duration: "3:45",
        status: "processing",
      },
    };

    return NextResponse.json(geminiResponse);
  } catch (error) {
    console.error("Gemini API hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
