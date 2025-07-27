"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ExplorePage() {
  const [tab, setTab] = useState("post");
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set()); // Beğenilen post'lar
  const [comments, setComments] = useState({}); // Post ID -> yorumlar
  const [showComments, setShowComments] = useState(null); // Hangi post'un yorumları açık
  const [newComment, setNewComment] = useState(""); // Yeni yorum metni
  const [commentLoading, setCommentLoading] = useState(false); // Yorum yükleme durumu
  const [followingUsers, setFollowingUsers] = useState(new Set()); // Takip edilen kullanıcılar
  // Reels formu için state
  const [reelDesc, setReelDesc] = useState("");
  const [reelVideo, setReelVideo] = useState(null);
  const [reelLoading, setReelLoading] = useState(false);
  const [reelMsg, setReelMsg] = useState("");
  const reelsContainerRef = useRef(null);

  useEffect(() => {
    fetchPostsAndProfiles();
    fetchUserLikes();
    fetchUserFollows();
  }, [tab]);

  // Kullanıcının takip ettiği kişileri çek
  async function fetchUserFollows() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Oturum açmamış kullanıcılar için localStorage'dan takip listesini al
      const anonymousFollows = JSON.parse(
        localStorage.getItem("anonymousFollows") || "[]"
      );
      setFollowingUsers(new Set(anonymousFollows));
      return;
    }

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (follows) {
      setFollowingUsers(new Set(follows.map((follow) => follow.following_id)));
    }
  }

  // Kullanıcının beğendiği post'ları çek
  async function fetchUserLikes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);

    if (likes) {
      setLikedPosts(new Set(likes.map((like) => like.post_id)));
    }
  }

  // Beğeni ekle/çıkar
  async function toggleLike(postId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("Kullanıcı giriş yapmamış");
        return;
      }

      const isLiked = likedPosts.has(postId);
      console.log("Beğeni durumu:", isLiked, "Post ID:", postId);

      if (isLiked) {
        // Beğeniyi kaldır
        const { error: deleteError } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Beğeni silme hatası:", deleteError);
          return;
        }

        // Posts tablosundaki likes sayısını azalt
        const { error: decrementError } = await supabase.rpc(
          "decrement_likes",
          { post_id: postId }
        );
        if (decrementError) {
          console.error("Likes azaltma hatası:", decrementError);
        }

        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Beğeni ekle
        const { error: insertError } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        if (insertError) {
          console.error("Beğeni ekleme hatası:", insertError);
          return;
        }

        // Posts tablosundaki likes sayısını artır
        const { error: incrementError } = await supabase.rpc(
          "increment_likes",
          { post_id: postId }
        );
        if (incrementError) {
          console.error("Likes artırma hatası:", incrementError);
        }

        setLikedPosts((prev) => new Set([...prev, postId]));
      }

      // Post listesini güncelle
      await fetchPostsAndProfiles();
      console.log("Beğeni işlemi tamamlandı");
    } catch (error) {
      console.error("Beğeni işlemi hatası:", error);
    }
  }

  // Yorumları çek
  async function fetchComments(postId) {
    console.log("Yorumlar yükleniyor, postId:", postId);

    const { data: commentData, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Yorum yükleme hatası:", error);
      return;
    }

    console.log("Yüklenen yorumlar:", commentData);

    setComments((prev) => ({
      ...prev,
      [postId]: commentData || [],
    }));
  }

  // Yorum ekle
  async function addComment(postId) {
    try {
      if (!newComment.trim()) {
        console.log("Boş yorum");
        return;
      }

      setCommentLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("Kullanıcı giriş yapmamış");
        setCommentLoading(false);
        return;
      }

      console.log("Yorum ekleniyor:", newComment, "Post ID:", postId);

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) {
        console.error("Yorum ekleme hatası:", error);
        setCommentLoading(false);
        return;
      }

      // Comments sayısını artır
      const { error: incrementError } = await supabase.rpc(
        "increment_comments",
        { post_id: postId }
      );
      if (incrementError) {
        console.error("Comments artırma hatası:", incrementError);
      }

      // Yorumları yenile
      await fetchComments(postId);

      // Post listesini güncelle
      await fetchPostsAndProfiles();

      setNewComment("");
      console.log("Yorum başarıyla eklendi");
    } catch (error) {
      console.error("Yorum ekleme hatası:", error);
    } finally {
      setCommentLoading(false);
    }
  }

  // Takip et/Takibi bırak
  async function toggleFollow(userId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Oturum açmamış kullanıcılar için anonim takip sistemi
        console.log("Anonim kullanıcı takip işlemi");

        // LocalStorage'dan anonim takip listesini al
        const anonymousFollows = JSON.parse(
          localStorage.getItem("anonymousFollows") || "[]"
        );
        const isFollowing = anonymousFollows.includes(userId);

        if (isFollowing) {
          // Takibi bırak
          const newFollows = anonymousFollows.filter((id) => id !== userId);
          localStorage.setItem("anonymousFollows", JSON.stringify(newFollows));
          setFollowingUsers(new Set(newFollows));
          console.log("Anonim takip bırakıldı");
        } else {
          // Takip et
          const newFollows = [...anonymousFollows, userId];
          localStorage.setItem("anonymousFollows", JSON.stringify(newFollows));
          setFollowingUsers(new Set(newFollows));
          console.log("Anonim takip edildi");
        }
        return;
      }

      // Kendini takip etmeye çalışıyorsa engelle
      if (user.id === userId) {
        console.log("Kendini takip edemezsin");
        return;
      }

      const isFollowing = followingUsers.has(userId);
      console.log("Takip durumu:", isFollowing, "User ID:", userId);

      if (isFollowing) {
        // Takibi bırak
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);

        if (error) {
          console.error("Takibi bırakma hatası:", error);
          return;
        }

        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        console.log("Takip bırakıldı");
      } else {
        // Takip et
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: userId });

        if (error) {
          console.error("Takip etme hatası:", error);
          return;
        }

        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
        console.log("Takip edildi");
      }
    } catch (error) {
      console.error("Takip işlemi hatası:", error);
    }
  }

  // Yorum modal'ını aç/kapat
  function toggleComments(postId) {
    console.log("toggleComments çağrıldı, postId:", postId);
    console.log("Mevcut showComments:", showComments);

    if (showComments === postId) {
      console.log("Modal kapatılıyor");
      setShowComments(null);
    } else {
      console.log("Modal açılıyor");
      setShowComments(postId);
      if (!comments[postId]) {
        console.log("Yorumlar yükleniyor");
        fetchComments(postId);
      }
    }
  }

  async function fetchPostsAndProfiles() {
    setLoading(true);
    const { data: postData } = await supabase
      .from("posts")
      .select("*")
      .eq("type", tab)
      .order("created_at", { ascending: false });
    setPosts(postData || []);
    // Kullanıcı profillerini topluca çek
    const userIds = [...new Set((postData || []).map((p) => p.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);
      // id -> profile objesi
      const profileMap = {};
      (profileData || []).forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
    } else {
      setProfiles({});
    }
    setLoading(false);
  }

  // Sayı formatını güzelleştiren fonksiyon
  function formatNumber(num) {
    if (num === null || num === undefined || num === 0) return "0";
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + "K";
    return (num / 1000000).toFixed(1) + "M";
  }

  // Tarih formatını güzelleştiren fonksiyon
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Az önce";
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInHours < 48) {
      return "Dün";
    } else {
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  // Kullanıcı adını güzelleştiren fonksiyon
  function formatUsername(userId) {
    // Eğer email formatındaysa @ işaretinden öncesini al
    if (userId && userId.includes("@")) {
      return userId.split("@")[0];
    }
    // Değilse ilk 8 karakteri al ve büyük harf yap
    return userId ? userId.slice(0, 8).toUpperCase() : "Kullanıcı";
  }

  async function handleReelSubmit(e) {
    e.preventDefault();
    setReelMsg("");
    setReelLoading(true);
    if (!reelVideo) {
      setReelMsg("Lütfen bir video seçin.");
      setReelLoading(false);
      return;
    }
    // Video yükle
    const user = (await supabase.auth.getUser()).data.user;
    const fileExt = reelVideo.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("reels-video")
      .upload(fileName, reelVideo, { upsert: true });
    if (uploadError) {
      setReelMsg("Video yüklenemedi: " + uploadError.message);
      setReelLoading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("reels-video")
      .getPublicUrl(fileName);
    const media_url = urlData.publicUrl;
    // Post olarak kaydet
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: reelDesc,
      media_url,
      type: "reel",
    });
    if (!error) {
      setReelMsg("Reel başarıyla paylaşıldı!");
      setReelDesc("");
      setReelVideo(null);
      fetchPostsAndProfiles();
    } else {
      setReelMsg("Reel paylaşılırken hata oluştu!");
    }
    setReelLoading(false);
  }

  // Scroll snap için reels container'a odaklanma
  useEffect(() => {
    if (tab === "reel" && reelsContainerRef.current) {
      reelsContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [tab, posts.length]);

  return (
    <div style={{ maxWidth: 540, margin: "40px auto" }}>
      {/* Sekmeler */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          background: "#f8fafc",
          padding: 8,
          borderRadius: 16,
          border: "1px solid rgba(124,58,237,0.1)",
        }}
      >
        <button
          onClick={() => setTab("post")}
          style={{
            flex: 1,
            padding: "14px 0",
            background:
              tab === "post"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: tab === "post" ? "#fff" : "#7c3aed",
            border: "none",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            boxShadow:
              tab === "post" ? "0 4px 16px rgba(102,126,234,0.3)" : "none",
            transition: "all 0.3s ease",
            position: "relative",
          }}
        >
          📝 Gönderiler
        </button>
        <button
          onClick={() => setTab("reel")}
          style={{
            flex: 1,
            padding: "14px 0",
            background:
              tab === "reel"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: tab === "reel" ? "#fff" : "#7c3aed",
            border: "none",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            boxShadow:
              tab === "reel" ? "0 4px 16px rgba(102,126,234,0.3)" : "none",
            transition: "all 0.3s ease",
            position: "relative",
          }}
        >
          🎬 Reels
        </button>
      </div>

      {/* Reels Video Ekleme Formu */}
      {tab === "reel" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px #7c3aed22",
            padding: 20,
            marginBottom: 32,
          }}
        >
          <form onSubmit={handleReelSubmit}>
            <textarea
              placeholder="Reel açıklaması (isteğe bağlı)"
              value={reelDesc}
              onChange={(e) => setReelDesc(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ddd",
                marginBottom: 8,
                resize: "vertical",
              }}
            />
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setReelVideo(e.target.files[0])}
              style={{ marginBottom: 8 }}
            />
            <button
              type="submit"
              disabled={reelLoading}
              style={{
                padding: "10px 24px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {reelLoading ? "Yükleniyor..." : "Reel Paylaş"}
            </button>
          </form>
          {reelMsg && (
            <div
              style={{
                color: reelMsg.includes("başarı") ? "green" : "red",
                marginTop: 8,
              }}
            >
              {reelMsg}
            </div>
          )}
        </div>
      )}

      {/* İçerik */}
      {loading && <div>Yükleniyor...</div>}
      {!loading && posts.length === 0 && <div>Henüz hiç içerik yok.</div>}

      {/* Gönderiler Sekmesi */}
      {tab === "post" &&
        posts.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
              padding: 0,
              marginBottom: 24,
              transition: "all 0.3s ease",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(124,58,237,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(124,58,237,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(124,58,237,0.08)";
            }}
          >
            {/* Kullanıcı Bilgisi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px 12px 20px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: 16,
                  border: "2px solid rgba(124,58,237,0.1)",
                }}
              >
                {profiles[p.user_id]?.avatar_url ? (
                  <img
                    src={profiles[p.user_id].avatar_url}
                    alt="pp"
                    style={{ width: 40, height: 40, objectFit: "cover" }}
                  />
                ) : (
                  formatUsername(p.user_id)?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#7c3aed",
                    fontSize: 15,
                    marginBottom: 2,
                  }}
                >
                  {formatUsername(p.user_id)}
                </div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  {formatDate(p.created_at)}
                </div>
              </div>
              <button
                onClick={() => toggleFollow(p.user_id)}
                style={{
                  background: followingUsers.has(p.user_id)
                    ? "#7c3aed"
                    : "transparent",
                  border: "1px solid #7c3aed",
                  color: followingUsers.has(p.user_id) ? "#fff" : "#7c3aed",
                  padding: "6px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {followingUsers.has(p.user_id) ? "Takip Ediliyor" : "Takip Et"}
              </button>
            </div>

            {/* Medya */}
            {p.media_url && (
              <div style={{ position: "relative" }}>
                <img
                  src={p.media_url}
                  alt="görsel"
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* İçerik */}
            {p.content && (
              <div
                style={{
                  padding: "16px 20px 12px 20px",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#333",
                  lineHeight: 1.5,
                }}
              >
                {p.content}
              </div>
            )}

            {/* Beğeni Butonu - Gönderiler için */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 20px 16px 20px",
                borderTop: "1px solid #f0f0f0",
                marginTop: 8,
              }}
            >
              <button
                onClick={() => toggleLike(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: likedPosts.has(p.id) ? "#ff1493" : "#666",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,20,147,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {likedPosts.has(p.id) ? "❤️" : "🤍"}
                </span>
                <span>{formatNumber(p.likes)}</span>
              </button>

              <button
                onClick={() => toggleComments(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: "#666",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 16 }}>💬</span>
                <span>{formatNumber(p.comments)}</span>
              </button>
            </div>
          </div>
        ))}

      {/* Reels Sekmesi - Instagram Reels Tasarımı */}
      {tab === "reel" && (
        <div
          ref={reelsContainerRef}
          style={{
            maxHeight: 600,
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "0 8px",
          }}
        >
          {posts.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: "#000",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                padding: 0,
                minHeight: 480,
                marginBottom: 16,
                overflow: "hidden",
                position: "relative",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {p.media_url && (
                <video
                  src={p.media_url}
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    background: "#111",
                  }}
                />
              )}

              {/* Gradient Overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  pointerEvents: "none",
                }}
              />

              {/* Üst Kısım - Ses İkonu */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  🔇
                </div>
              </div>

              {/* Sağ Taraf - Etkileşim Butonları */}
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: 80,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  zIndex: 10,
                }}
              >
                {/* Profil Fotoğrafı */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: 18,
                    border: "3px solid #fff",
                    cursor: "pointer",
                  }}
                >
                  {profiles[p.user_id]?.avatar_url ? (
                    <img
                      src={profiles[p.user_id].avatar_url}
                      alt="pp"
                      style={{ width: 48, height: 48, objectFit: "cover" }}
                    />
                  ) : (
                    formatUsername(p.user_id)?.slice(0, 2).toUpperCase()
                  )}
                </div>

                {/* Beğeni Butonu */}
                <div style={{ textAlign: "center" }}>
                  <div
                    onClick={() => toggleLike(p.id)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: likedPosts.has(p.id)
                        ? "rgba(255,20,147,0.8)"
                        : "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 20,
                      cursor: "pointer",
                      marginBottom: 4,
                      transition: "all 0.2s ease",
                      transform: likedPosts.has(p.id)
                        ? "scale(1.1)"
                        : "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (!likedPosts.has(p.id)) {
                        e.currentTarget.style.background =
                          "rgba(255,20,147,0.6)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!likedPosts.has(p.id)) {
                        e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                      }
                    }}
                  >
                    {likedPosts.has(p.id) ? "❤️" : "🤍"}
                  </div>
                  <div
                    style={{
                      color: likedPosts.has(p.id) ? "#ff1493" : "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "color 0.2s ease",
                    }}
                  >
                    {formatNumber(p.likes)}
                  </div>
                </div>

                {/* Yorum Butonu */}
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => toggleComments(p.id)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 20,
                      cursor: "pointer",
                      marginBottom: 4,
                      border: "none",
                      outline: "none",
                    }}
                  >
                    💬
                  </button>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                    {formatNumber(p.comments)}
                  </div>
                </div>

                {/* Paylaş Butonu */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 20,
                      cursor: "pointer",
                      marginBottom: 4,
                    }}
                  >
                    📤
                  </div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                    Paylaş
                  </div>
                </div>
              </div>

              {/* Sol Alt - Kullanıcı Bilgileri ve Açıklama */}
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  right: 80,
                  color: "#fff",
                  zIndex: 10,
                }}
              >
                {/* Kullanıcı Bilgileri */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {formatUsername(p.user_id)}
                  </div>
                  <button
                    onClick={() => toggleFollow(p.user_id)}
                    style={{
                      background: followingUsers.has(p.user_id)
                        ? "#fff"
                        : "transparent",
                      border: "1px solid #fff",
                      color: followingUsers.has(p.user_id) ? "#000" : "#fff",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {followingUsers.has(p.user_id)
                      ? "Takip Ediliyor"
                      : "Takip Et"}
                  </button>
                </div>

                {/* Açıklama */}
                {p.content && (
                  <div
                    style={{
                      fontSize: 14,
                      color: "#f0f0f0",
                      marginBottom: 8,
                      lineHeight: 1.4,
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      wordBreak: "break-word",
                    }}
                  >
                    {p.content}
                  </div>
                )}

                {/* Hashtag'ler */}
                <div
                  style={{
                    fontSize: 13,
                    color: "#ccc",
                    marginBottom: 8,
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  #growup #proje #teknoloji #yazılım #geliştirme
                </div>

                {/* Müzik Bilgisi */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "#ccc",
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  <span>🎵</span>
                  <span>{formatUsername(p.user_id)} - Orijinal ses</span>
                </div>

                {/* Tarih */}
                <div
                  style={{
                    fontSize: 12,
                    color: "#aaa",
                    marginTop: 8,
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {formatDate(p.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yorum Modal'ı */}
      {showComments && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowComments(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, color: "#333", fontWeight: 600 }}>
                Yorumlar
              </h3>
              <button
                onClick={() => setShowComments(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ✕
              </button>
            </div>

            {/* Yorumlar Listesi */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {comments[showComments]?.length > 0 ? (
                comments[showComments].map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {formatUsername(comment.user_id)
                        ?.slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#333",
                          }}
                        >
                          {formatUsername(comment.user_id)}
                        </span>
                        <span style={{ fontSize: 12, color: "#888" }}>
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 14, color: "#444", lineHeight: 1.4 }}
                      >
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "40px 0",
                  }}
                >
                  Henüz yorum yok. İlk yorumu sen yap!
                </div>
              )}
            </div>

            {/* Yorum Ekleme Formu */}
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                background: "#f8f9fa",
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorumunuzu yazın..."
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "1px solid #ddd",
                    borderRadius: 20,
                    fontSize: 14,
                    outline: "none",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !commentLoading) {
                      addComment(showComments);
                    }
                  }}
                />
                <button
                  onClick={() => addComment(showComments)}
                  disabled={commentLoading || !newComment.trim()}
                  style={{
                    padding: "12px 20px",
                    background:
                      commentLoading || !newComment.trim() ? "#ccc" : "#7c3aed",
                    color: "#fff",
                    border: "none",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      commentLoading || !newComment.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {commentLoading ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
