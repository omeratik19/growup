import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://datuewrhrhgqrvrljduw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdHVld3JocmhncXJ2cmxqZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTc5NjksImV4cCI6MjA2ODA5Mzk2OX0.lGKksVqywxH8Pts6gZMor4M5J9_cjsKInbcOolw53Yg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth hook - yeni kullanıcı kayıt olduğunda profiles tablosuna ekle
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("Auth event:", event, session?.user?.id);

  if (event === "SIGNED_UP" && session?.user) {
    console.log("Yeni kullanıcı kayıt oldu, profile oluşturuluyor...");

    try {
      // Önce mevcut profile var mı kontrol et
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (existingProfile) {
        console.log("Profile zaten mevcut");
        return;
      }

      // Yeni profile oluştur
      const { error } = await supabase.from("profiles").insert([
        {
          id: session.user.id,
          username: session.user.email?.split("@")[0] || "user",
          avatar_url: null,
          bio: null,
        },
      ]);

      if (error) {
        console.error("Profile oluşturma hatası:", error);
      } else {
        console.log("Profile başarıyla oluşturuldu");
      }
    } catch (error) {
      console.error("Auth hook hatası:", error);
    }
  }
});
