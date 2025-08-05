"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SellerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productStock, setProductStock] = useState("");
  const [uploading, setUploading] = useState(false);

  // İletişim bilgileri
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");

  const categories = [
    { id: "electronics", name: "Elektronik", icon: "📱" },
    { id: "fashion", name: "Moda", icon: "👕" },
    { id: "home", name: "Ev & Yaşam", icon: "🏠" },
    { id: "sports", name: "Spor", icon: "⚽" },
    { id: "books", name: "Kitap", icon: "📚" },
    { id: "other", name: "Diğer", icon: "📦" },
  ];

  useEffect(() => {
    checkUser();
    fetchUserProducts();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
  }

  async function fetchUserProducts() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
    }
    setLoading(false);
  }

  async function handleImageUpload(file) {
    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Resim yükleme hatası:", error);
      alert("Resim yüklenirken hata oluştu!");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!productName || !productPrice || !productCategory) {
      alert("Lütfen gerekli alanları doldurun!");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let imageUrl = null;
      if (productImage) {
        imageUrl = await handleImageUpload(productImage);
      }

      const { data, error } = await supabase.from("products").insert({
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice),
        category: productCategory,
        image_url: imageUrl,
        stock: parseInt(productStock) || 0,
        seller_id: user.id,
        status: "active",
      });

      if (error) throw error;

      // Form'u temizle
      setProductName("");
      setProductDescription("");
      setProductPrice("");
      setProductCategory("");
      setProductImage(null);
      setProductStock("");
      setShowForm(false);

      // Ürünleri yeniden yükle
      fetchUserProducts();

      alert("Ürün başarıyla eklendi! 🎉");
    } catch (error) {
      console.error("Ürün ekleme hatası:", error);
      alert("Ürün eklenirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(productId) {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      fetchUserProducts();
      alert("Ürün başarıyla silindi!");
    } catch (error) {
      console.error("Ürün silme hatası:", error);
      alert("Ürün silinirken hata oluştu!");
    }
  }

  async function toggleProductStatus(productId, currentStatus) {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);

      if (error) throw error;

      fetchUserProducts();
      alert(
        `Ürün durumu ${
          newStatus === "active" ? "aktif" : "pasif"
        } olarak güncellendi!`
      );
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
      alert("Durum güncellenirken hata oluştu!");
    }
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div style={{ fontSize: "18px", color: "#6b7280" }}>
            Yükleniyor...
          </div>
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
            <span style={{ fontSize: "24px" }}>🏪</span>
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "#ff6b6b" }}
            >
              Satıcı Paneli
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              🛒 Mağazaya Git
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              style={{
                background: "transparent",
                border: "1px solid #7c3aed",
                color: "#7c3aed",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📊 Dashboard
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📦</div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#374151" }}
            >
              {products.length}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Toplam Ürün
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>✅</div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}
            >
              {products.filter((p) => p.status === "active").length}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Aktif Ürün</div>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>💰</div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}
            >
              ₺
              {products
                .reduce((sum, p) => sum + (p.price || 0), 0)
                .toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Toplam Değer
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "32px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "16px",
            }}
          >
            📞 İletişim Bilgileri
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            Müşterilerin size ulaşabilmesi için iletişim bilgilerinizi girin.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                WhatsApp Numarası
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="905555555555"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Instagram Kullanıcı Adı
              </label>
              <input
                type="text"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                placeholder="@kullaniciadi"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Add Product Button */}
        <div style={{ marginBottom: "32px" }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {showForm ? "❌ İptal" : "➕ Yeni Ürün Ekle"}
          </button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div
            style={{
              background: "#fff",
              padding: "32px",
              borderRadius: "16px",
              marginBottom: "32px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "24px",
              }}
            >
              🆕 Yeni Ürün Ekle
            </h2>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                    placeholder="Ürün adını girin..."
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Kategori *
                  </label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                    required
                  >
                    <option value="">Kategori seçin...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Ürün Açıklaması
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                  placeholder="Ürün açıklamasını girin..."
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Ürün Görseli
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImage(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                  }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  PNG, JPG, JPEG (Max 5MB)
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploading}
                style={{
                  background: loading || uploading ? "#d1d5db" : "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading || uploading ? "not-allowed" : "pointer",
                }}
              >
                {loading || uploading ? "⏳ İşleniyor..." : "✅ Ürünü Kaydet"}
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "24px",
            }}
          >
            📦 Ürünlerim
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
              <div style={{ color: "#6b7280" }}>Ürünler yükleniyor...</div>
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
              <div
                style={{
                  fontSize: "18px",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Henüz ürün eklemediniz
              </div>
              <div style={{ color: "#6b7280" }}>
                İlk ürününüzü eklemek için "Yeni Ürün Ekle" butonuna tıklayın
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border:
                      product.status === "inactive"
                        ? "2px solid #f3f4f6"
                        : "none",
                    opacity: product.status === "inactive" ? 0.7 : 1,
                  }}
                >
                  {/* Product Image */}
                  <div style={{ marginBottom: "16px" }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "200px",
                          background: "#f3f4f6",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9ca3af",
                          fontSize: "48px",
                        }}
                      >
                        📷
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    {product.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "12px",
                      lineHeight: "1.5",
                    }}
                  >
                    {product.description || "Açıklama yok"}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                      ₺{product.price?.toLocaleString()}
                    </span>

                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Stok: {product.stock || 0}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          product.status === "active" ? "#dcfce7" : "#fef3c7",
                        color:
                          product.status === "active" ? "#166534" : "#92400e",
                      }}
                    >
                      {product.status === "active" ? "✅ Aktif" : "⏸️ Pasif"}
                    </span>

                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "#f3f4f6",
                        color: "#374151",
                      }}
                    >
                      {categories.find((c) => c.id === product.category)
                        ?.name || "Diğer"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        toggleProductStatus(product.id, product.status)
                      }
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: "transparent",
                        color: "#374151",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {product.status === "active"
                        ? "⏸️ Pasif Yap"
                        : "✅ Aktif Yap"}
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #ef4444",
                        borderRadius: "6px",
                        background: "transparent",
                        color: "#ef4444",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
