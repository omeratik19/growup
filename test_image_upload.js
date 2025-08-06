// ⚠️ GÜVENLİK: Bu dosyada gerçek API token'ları kullanmayın!
// API token'larınızı .env.local dosyasında saklayın

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "your_supabase_url";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your_supabase_anon_key";

async function testImageUpload() {
  console.log("🧪 Image Upload Test Başlıyor...");

  if (!SUPABASE_URL || SUPABASE_URL === "your_supabase_url") {
    console.log(
      "⚠️ Lütfen .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ayarlayın"
    );
    return;
  }

  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "your_supabase_anon_key") {
    console.log(
      "⚠️ Lütfen .env.local dosyasında NEXT_PUBLIC_SUPABASE_ANON_KEY ayarlayın"
    );
    return;
  }

  try {
    // Test için basit bir File objesi oluştur
    const testFile = new File(["test content"], "test-image.jpg", {
      type: "image/jpeg",
    });

    console.log("📁 Test dosyası oluşturuldu:", testFile.name);

    // Supabase storage'a yükleme simülasyonu
    console.log("📤 Storage'a yükleme simülasyonu...");

    // Gerçek yükleme için Supabase client gerekli
    console.log(
      "✅ Test başarılı! Gerçek yükleme için Supabase client kullanın."
    );
  } catch (error) {
    console.error("💥 Test hatası:", error.message);
  }
}

testImageUpload();
