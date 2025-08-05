"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ShopPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // LocalStorage'dan sepeti yükle
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    console.log("Shop: Loading cart from localStorage:", savedCart);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      console.log("Shop: Parsed cart:", parsedCart);
      setCart(parsedCart);
    }
  }, []);

  // Sepeti LocalStorage'a kaydet
  useEffect(() => {
    console.log("Shop: Saving cart to localStorage:", cart);
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ürünler yüklenirken hata:", error);
        return;
      }

      // Transform data for display
      const transformedProducts = data.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        image: product.image_url,
        category: product.category,
        rating: product.rating || 0,
        reviews: product.review_count || 0,
        discount: product.original_price
          ? Math.round(
              ((product.original_price - product.price) /
                product.original_price) *
                100
            )
          : 0,
        inStock: product.stock > 0,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: "all", name: "Tümü", icon: "🏪" },
    { id: "electronics", name: "Elektronik", icon: "📱" },
    { id: "fashion", name: "Moda", icon: "👕" },
    { id: "home", name: "Ev & Yaşam", icon: "🏠" },
    { id: "sports", name: "Spor", icon: "⚽" },
  ];

  const addToCart = (product) => {
    console.log("YENİ SEPET: Ürün ekleniyor:", product.name);
    console.log("YENİ SEPET: Ürün detayları:", product);

    // Mevcut sepeti al
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    console.log("YENİ SEPET: Mevcut sepet:", currentCart);

    // Ürün zaten sepette var mı kontrol et
    const existingItemIndex = currentCart.findIndex(
      (item) => item.id === product.id
    );

    if (existingItemIndex !== -1) {
      // Miktarı artır
      currentCart[existingItemIndex].quantity =
        (currentCart[existingItemIndex].quantity || 1) + 1;
      console.log(
        "YENİ SEPET: Miktar artırıldı:",
        currentCart[existingItemIndex]
      );
    } else {
      // Yeni ürün ekle
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
      console.log(
        "YENİ SEPET: Yeni ürün eklendi:",
        currentCart[currentCart.length - 1]
      );
    }

    // Sepeti güncelle
    setCart(currentCart);
    localStorage.setItem("cart", JSON.stringify(currentCart));

    console.log("YENİ SEPET: Güncellenmiş sepet:", currentCart);
    alert(`✅ ${product.name} sepete eklendi!`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
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
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🛒</span>
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "#ff6b6b" }}
            >
              GrowShop
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: "500px", margin: "0 40px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 48px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "25px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ff6b6b")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <span
                style={{
                  position: "absolute",
                  left: "16px",
                  fontSize: "18px",
                }}
              >
                🔍
              </span>
            </div>
          </div>

          {/* Cart */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "16px",
                color: "#6b7280",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🏠 Ana Sayfa
            </button>

            <button
              onClick={() => router.push("/seller")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "16px",
                color: "#ff6b6b",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "8px",
                transition: "background 0.2s",
                fontWeight: "600",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#fef2f2")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🏪 Satıcı Paneli
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => router.push("/cart")}
                style={{
                  background: "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  fontSize: "20px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                🛒
                {cart.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Categories */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "32px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                background:
                  selectedCategory === category.id ? "#ff6b6b" : "#fff",
                color: selectedCategory === category.id ? "#fff" : "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "25px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
            <div style={{ color: "#6b7280" }}>Ürünler yükleniyor...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div
              style={{
                fontSize: "18px",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Ürün bulunamadı
            </div>
            <div style={{ color: "#6b7280" }}>
              Arama kriterlerinizi değiştirmeyi deneyin
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px rgba(0,0,0,0.05)";
                }}
              >
                {/* Product Image */}
                <div
                  style={{
                    position: "relative",
                    marginBottom: "16px",
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                  {product.discount > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: "#ef4444",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      %{product.discount} İndirim
                    </div>
                  )}
                  {!product.inStock && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#6b7280",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Stokta Yok
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                    lineHeight: "1.4",
                  }}
                >
                  {product.name}
                </h3>

                {/* Rating */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        style={{
                          color:
                            i < Math.floor(product.rating)
                              ? "#fbbf24"
                              : "#d1d5db",
                          fontSize: "14px",
                        }}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    ({product.reviews})
                  </span>
                </div>

                {/* Price */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#ff6b6b",
                    }}
                  >
                    ₺{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice > product.price && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        textDecoration: "line-through",
                      }}
                    >
                      ₺{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    addToCart(product);
                  }}
                  disabled={!product.inStock}
                  style={{
                    width: "100%",
                    background: product.inStock ? "#ff6b6b" : "#d1d5db",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: product.inStock ? "pointer" : "not-allowed",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (product.inStock) {
                      e.currentTarget.style.background = "#ff5252";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (product.inStock) {
                      e.currentTarget.style.background = "#ff6b6b";
                    }
                  }}
                >
                  {product.inStock ? "🛒 Sepete Ekle" : "Stokta Yok"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
