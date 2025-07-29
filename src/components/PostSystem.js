"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PostSystem() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");

  // Postları yükle
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          likes,
          comments
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Post yükleme hatası:", error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error("Post yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }

  // Resim seçimi
  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
      setPostImage(file);

      // Preview oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Post paylaş
  async function handleSubmit(e) {
    e.preventDefault();

    if (!postContent.trim() && !postImage) {
      setMessage("Lütfen bir metin veya resim ekleyin.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Kullanıcı kontrolü
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Giriş yapmanız gerekiyor.");
        return;
      }

      let mediaUrl = null;

      // Resim yükle
      if (postImage) {
        const fileExt = postImage.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;

        console.log("Resim yükleniyor:", fileName);

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, postImage);

        if (uploadError) {
          console.error("Resim yükleme hatası:", uploadError);
          setMessage("Resim yüklenemedi: " + uploadError.message);
          return;
        }

        // Public URL al
        const { data: urlData } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
        console.log("Resim URL'si:", mediaUrl);
      }

      // Post kaydet
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: postContent.trim(),
        media_url: mediaUrl,
        type: "post",
      });

      if (error) {
        console.error("Post kaydetme hatası:", error);
        setMessage("Post paylaşılırken hata oluştu: " + error.message);
        return;
      }

      // Başarılı
      setMessage("Post başarıyla paylaşıldı!");
      setPostContent("");
      setPostImage(null);
      setImagePreview(null);

      // Postları yenile
      fetchPosts();
    } catch (error) {
      console.error("Post oluşturma hatası:", error);
      setMessage("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      {/* Post Form */}
      <div className="modern-card animate-fadeInUp">
        <h3
          className="neon-text"
          style={{ marginBottom: 20, fontSize: "24px" }}
        >
          ✨ Yeni Post Oluştur
        </h3>

        <form onSubmit={handleSubmit}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Ne düşünüyorsun? 💭"
            className="modern-textarea"
            style={{ marginBottom: 16 }}
          />

          {/* Resim Seçimi */}
          <div style={{ marginBottom: 16 }}>
            <label
              className="neon-button"
              style={{ marginBottom: 8, display: "inline-block" }}
            >
              📸 Resim Seç
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: "none" }}
              />
            </label>

            {imagePreview && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: 200,
                    maxHeight: 200,
                    borderRadius: 12,
                    border: "2px solid var(--neon-blue)",
                    boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
                  }}
                />
              </div>
            )}
          </div>

          {/* Mesaj */}
          {message && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                background: message.includes("başarıyla")
                  ? "rgba(0, 255, 65, 0.1)"
                  : "rgba(255, 0, 128, 0.1)",
                border: message.includes("başarıyla")
                  ? "1px solid var(--neon-green)"
                  : "1px solid var(--neon-pink)",
                color: message.includes("başarıyla")
                  ? "var(--neon-green)"
                  : "var(--neon-pink)",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="gradient-button animate-gradient"
            style={{
              width: "100%",
              fontSize: "16px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div
                  className="loading-spinner"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                ></div>
                Paylaşılıyor...
              </span>
            ) : (
              "🚀 Paylaş"
            )}
          </button>
        </form>
      </div>

      {/* Posts Listesi */}
      <div>
        <h3
          className="neon-text-blue"
          style={{ marginBottom: 24, fontSize: "28px" }}
        >
          🌟 Gönderiler
        </h3>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              className="loading-spinner"
              style={{ margin: "0 auto 16px" }}
            ></div>
            <span className="neon-text">Yükleniyor...</span>
          </div>
        )}

        {posts.map((post, index) => (
          <div
            key={post.id}
            className="modern-card animate-fadeInUp"
            style={{
              animationDelay: `${index * 0.1}s`,
              marginBottom: 24,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--gradient-neon)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  👤
                </div>
                <div>
                  <div
                    className="neon-text"
                    style={{ fontSize: "16px", fontWeight: "600" }}
                  >
                    Kullanıcı {post.user_id.slice(0, 8)}
                  </div>
                  <div
                    style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                  >
                    {new Date(post.created_at).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            </div>

            {post.content && (
              <div
                style={{
                  marginBottom: 16,
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "var(--text-primary)",
                }}
              >
                {post.content}
              </div>
            )}

            {post.media_url && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={post.media_url}
                  alt="Post media"
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    borderRadius: 16,
                    border: "2px solid var(--border-color)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                  onError={(e) => {
                    console.error("Resim yüklenemedi:", post.media_url);
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Like ve Comment Sayıları */}
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--neon-pink)",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.textShadow = "0 0 10px var(--neon-pink)")
                }
                onMouseLeave={(e) => (e.target.style.textShadow = "none")}
              >
                <span style={{ fontSize: "20px" }}>❤️</span>
                <span>{post.likes || 0} beğeni</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--neon-blue)",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.textShadow = "0 0 10px var(--neon-blue)")
                }
                onMouseLeave={(e) => (e.target.style.textShadow = "none")}
              >
                <span style={{ fontSize: "20px" }}>💬</span>
                <span>{post.comments || 0} yorum</span>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && !loading && (
          <div
            className="modern-card"
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌟</div>
            <div
              className="neon-text"
              style={{ fontSize: "20px", marginBottom: "8px" }}
            >
              Henüz post yok
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              İlk postu sen paylaş!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
