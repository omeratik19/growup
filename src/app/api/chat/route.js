import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

    // ChatGPT API'si için gerekli ayarlar
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Sen yardımcı bir AI asistanısın. Türkçe konuşuyorsun ve kullanıcılara yardımcı oluyorsun.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("ChatGPT API hatası");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({
      response: aiResponse,
      success: true,
    });
  } catch (error) {
    console.error("Chat API hatası:", error);
    return NextResponse.json(
      {
        error: "Bir hata oluştu. Lütfen tekrar deneyin.",
        success: false,
      },
      { status: 500 }
    );
  }
}
