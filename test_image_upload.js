// Test: Resim yükleme ve görüntüleme
import { supabase } from "./src/lib/supabaseClient.js";

async function testImageUpload() {
  console.log("=== RESİM YÜKLEME TESTİ ===");

  // 1. Kullanıcı kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ Kullanıcı giriş yapmamış!");
    return;
  }
  console.log("✅ Kullanıcı:", user.id);

  // 2. Storage bucket kontrolü
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log(
    "📦 Buckets:",
    buckets.map((b) => b.name)
  );

  // 3. post-media bucket kontrolü
  const { data: files } = await supabase.storage.from("post-media").list();
  console.log("📁 post-media dosyaları:", files);

  // 4. Posts tablosu kontrolü
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);
  console.log("📝 Son 3 post:", posts);
}

// Test'i çalıştır
testImageUpload();
