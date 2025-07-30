"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // Giriş
        console.log("Giriş yapılıyor...");
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error("Giriş hatası:", error);
          setError(error.message);
        } else {
          setMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        // Kayıt
        console.log("Kayıt yapılıyor...", { email });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        console.log("Kayıt sonucu:", { data, error });

        if (error) {
          console.error("Kayıt hatası:", error);
          setError(`Kayıt hatası: ${error.message}`);
        } else {
          setMessage("Kayıt başarılı! Lütfen e-postanızı kontrol edin.");
          console.log("Kayıt başarılı, kullanıcı:", data.user);
        }
      }
    } catch (err) {
      console.error("Beklenmeyen hata:", err);
      setError(`Beklenmeyen hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h2>{isLogin ? "Giriş Yap" : "Kayıt Ol"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: loading ? "#ccc" : "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "İşleniyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        disabled={loading}
        style={{
          marginTop: 12,
          background: "none",
          color: "#7c3aed",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {isLogin
          ? "Hesabın yok mu? Kayıt ol"
          : "Zaten hesabın var mı? Giriş yap"}
      </button>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {message && <div style={{ color: "green", marginTop: 8 }}>{message}</div>}
    </div>
  );
}
