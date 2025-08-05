"use client";
import { useState, useRef, useEffect } from "react";

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Chat hatası:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Bağlantı hatası. Lütfen tekrar deneyin.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
        borderRadius: "20px",
        padding: "20px",
        height: "calc(100vh - 200px)",
        minHeight: "600px",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)",
        border: "2px solid rgba(0, 255, 255, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "2px solid rgba(0, 255, 255, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #00ffff, #00ff88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
            }}
          >
            🤖
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                color: "#00ffff",
                fontSize: "18px",
                fontWeight: "bold",
                textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
              }}
            >
              AI Asistan
            </h3>
            <p
              style={{
                margin: 0,
                color: "#00ff88",
                fontSize: "12px",
                opacity: 0.8,
              }}
            >
              Size nasıl yardımcı olabilirim?
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: "linear-gradient(45deg, #ff0080, #ff4080)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "white",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(255, 0, 128, 0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 0 20px rgba(255, 0, 128, 0.6)";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "0 0 15px rgba(255, 0, 128, 0.4)";
          }}
        >
          Temizle
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#00ff88",
              opacity: 0.7,
              marginTop: "50px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💬</div>
            <p>Sohbete başlamak için bir mesaj yazın!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent:
                message.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius:
                  message.sender === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background:
                  message.sender === "user"
                    ? "linear-gradient(45deg, #00ffff, #00ff88)"
                    : "linear-gradient(45deg, #ff0080, #ff4080)",
                color: message.sender === "user" ? "#000" : "#fff",
                boxShadow:
                  message.sender === "user"
                    ? "0 0 15px rgba(0, 255, 255, 0.4)"
                    : "0 0 15px rgba(255, 0, 128, 0.4)",
                position: "relative",
              }}
            >
              <div style={{ marginBottom: "5px" }}>{message.text}</div>
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.7,
                  textAlign: "right",
                }}
              >
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "linear-gradient(45deg, #ff0080, #ff4080)",
                color: "#fff",
                boxShadow: "0 0 15px rgba(255, 0, 128, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1.4s ease-in-out infinite both",
                  }}
                ></div>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1.4s ease-in-out infinite both 0.2s",
                  }}
                ></div>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1.4s ease-in-out infinite both 0.4s",
                  }}
                ></div>
              </div>
              <span>Yazıyor...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "25px",
            border: "2px solid rgba(0, 255, 255, 0.3)",
            background: "rgba(0, 0, 0, 0.3)",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.3s ease",
            boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#00ffff";
            e.target.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.4)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(0, 255, 255, 0.3)";
            e.target.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.2)";
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          style={{
            padding: "12px 20px",
            borderRadius: "25px",
            border: "none",
            background: "linear-gradient(45deg, #00ffff, #00ff88)",
            color: "#000",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)",
            transition: "all 0.3s ease",
            opacity: isLoading || !inputMessage.trim() ? 0.5 : 1,
          }}
          onMouseOver={(e) => {
            if (!isLoading && inputMessage.trim()) {
              e.target.style.boxShadow = "0 0 25px rgba(0, 255, 255, 0.6)";
            }
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.4)";
          }}
        >
          Gönder
        </button>
      </form>

      <style jsx>{`
        @keyframes pulse {
          0%,
          80%,
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
