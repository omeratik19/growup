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
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (isLogin) {
      // Giriş
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        setMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } else {
      // Kayıt
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Kayıt başarılı! Lütfen e-postanızı kontrol edin.");
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
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          {isLogin ? "Giriş Yap" : "Kayıt Ol"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{
          marginTop: 12,
          background: "none",
          color: "#7c3aed",
          border: "none",
          cursor: "pointer",
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
