"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import AIChat from "../../components/AIChat";

export default function AIPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#00ffff",
            fontSize: "18px",
            textAlign: "center",
          }}
        >
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 30px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "15px",
          border: "2px solid rgba(0, 255, 255, 0.3)",
          boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #00ffff, #00ff88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
            }}
          >
            🤖
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#00ffff",
                fontSize: "28px",
                fontWeight: "bold",
                textShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
              }}
            >
              GrowAI
            </h1>
            <p
              style={{
                margin: 0,
                color: "#00ff88",
                fontSize: "14px",
                opacity: 0.8,
              }}
            >
              AI Asistan ile Sohbet Edin
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "linear-gradient(45deg, #ff0080, #ff4080)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(255, 0, 128, 0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 0 25px rgba(255, 0, 128, 0.6)";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "0 0 15px rgba(255, 0, 128, 0.4)";
          }}
        >
          Dashboard'a Dön
        </button>
      </div>

      {/* AI Chat Container */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <AIChat />
      </div>
    </div>
  );
}
