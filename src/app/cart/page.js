"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);

  // LocalStorage'dan sepeti yükle
  useEffect(() => {
    console.log("YENİ CART: Sepet yükleniyor...");
    const savedCart = localStorage.getItem("cart");
    console.log("YENİ CART: localStorage'dan alınan veri:", savedCart);

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log("YENİ CART: Parse edilen sepet:", parsedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error("YENİ CART: Parse hatası:", error);
        setCart([]);
      }
    } else {
      console.log("YENİ CART: localStorage'da sepet bulunamadı");
      setCart([]);
    }
  }, []);

  // Sepeti LocalStorage'a kaydet
  useEffect(() => {
    console.log("Cart: Saving cart to localStorage:", cart);
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  console.log("Cart: Current cart state:", cart);
  console.log("Cart: Total items:", totalItems);
  console.log("Cart: Total price:", totalPrice);

  const generateWhatsAppMessage = () => {
    const items = cart
      .map(
        (item) =>
          `• ${item.name} - ${
            item.quantity || 1
          } adet - ₺${item.price.toLocaleString()}`
      )
      .join("\n");

    const message = `Merhaba! Aşağıdaki ürünleri satın almak istiyorum:\n\n${items}\n\nToplam: ₺${totalPrice.toLocaleString()}`;
    return encodeURIComponent(message);
  };

  const generateInstagramMessage = () => {
    const items = cart
      .map(
        (item) =>
          `• ${item.name} - ${
            item.quantity || 1
          } adet - ₺${item.price.toLocaleString()}`
      )
      .join("\n");

    return `Merhaba! Aşağıdaki ürünleri satın almak istiyorum:\n\n${items}\n\nToplam: ₺${totalPrice.toLocaleString()}`;
  };

  if (cart.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxWidth: "500px",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>🛒</div>
          <h1
            style={{ fontSize: "24px", color: "#374151", marginBottom: "16px" }}
          >
            Sepetiniz Boş
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Sepetinizde henüz ürün bulunmuyor. Alışverişe başlamak için mağazaya
            gidin.
          </p>
          <button
            onClick={() => router.push("/shop")}
            style={{
              background: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🛍️ Alışverişe Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🛒</span>
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "#ff6b6b" }}
            >
              Sepetim ({totalItems})
            </span>
          </div>

          <button
            onClick={() => router.push("/shop")}
            style={{
              background: "transparent",
              border: "1px solid #ff6b6b",
              color: "#ff6b6b",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🛍️ Alışverişe Devam Et
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "32px",
          }}
        >
          {/* Sepet Ürünleri */}
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "24px",
              }}
            >
              Sepetinizdeki Ürünler
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "4px",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#ff6b6b",
                      }}
                    >
                      ₺{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(item.id, (item.quantity || 1) - 1)
                      }
                      style={{
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: "4px",
                        width: "32px",
                        height: "32px",
                        fontSize: "18px",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>

                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        minWidth: "40px",
                        textAlign: "center",
                      }}
                    >
                      {item.quantity || 1}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(item.id, (item.quantity || 1) + 1)
                      }
                      style={{
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: "4px",
                        width: "32px",
                        height: "32px",
                        fontSize: "18px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "8px",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* İletişim Özeti */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              height: "fit-content",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "20px",
              }}
            >
              Sipariş Özeti
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#6b7280" }}>Ara Toplam:</span>
                <span>₺{totalPrice.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#6b7280" }}>Kargo:</span>
                <span>₺0.00</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#ff6b6b",
                }}
              >
                <span>Toplam:</span>
                <span>₺{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* İletişim Butonları */}
            <div style={{ marginTop: "20px" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "16px",
                }}
              >
                Satıcı ile İletişime Geçin
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => {
                    const message = generateWhatsAppMessage();
                    // WhatsApp numarasını dinamik hale getir
                    const whatsappNumber = "905555555555"; // Bu değer seller panelinden gelecek
                    window.open(
                      `https://wa.me/${whatsappNumber}?text=${message}`,
                      "_blank"
                    );
                  }}
                  style={{
                    width: "100%",
                    background: "#25D366",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  📱 WhatsApp ile İletişim
                </button>

                <button
                  onClick={() => {
                    const message = generateInstagramMessage();
                    // Instagram DM için kopyala
                    navigator.clipboard.writeText(message);
                    alert(
                      "Mesaj kopyalandı! Instagram'da satıcıya gönderebilirsiniz."
                    );
                  }}
                  style={{
                    width: "100%",
                    background:
                      "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  📸 Instagram ile İletişim
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#f0f9ff",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#0369a1",
              }}
            >
              <strong>Bilgi:</strong> Ödeme ve teslimat detayları satıcı ile
              görüşülecektir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
