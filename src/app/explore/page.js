"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ExplorePage() {
  const [tab, setTab] = useState("post");
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  // Reels formu için state
  const [reelDesc, setReelDesc] = useState("");
  const [reelVideo, setReelVideo] = useState(null);
  const [reelLoading, setReelLoading] = useState(false);
  const [reelMsg, setReelMsg] = useState("");
  const reelsContainerRef = useRef(null);

  useEffect(() => {
    fetchPostsAndProfiles();
  }, [tab]);

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
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab("post")}
          style={{
            flex: 1,
            padding: "12px 0",
            background: tab === "post" ? "#7c3aed" : "#ede9fe",
            color: tab === "post" ? "#fff" : "#7c3aed",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: tab === "post" ? "0 2px 12px #7c3aed22" : "none",
            transition: "all 0.2s",
          }}
        >
          Gönderiler
        </button>
        <button
          onClick={() => setTab("reel")}
          style={{
            flex: 1,
            padding: "12px 0",
            background: tab === "reel" ? "#7c3aed" : "#ede9fe",
            color: tab === "reel" ? "#fff" : "#7c3aed",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: tab === "reel" ? "0 2px 12px #7c3aed22" : "none",
            transition: "all 0.2s",
          }}
        >
          Reels
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
              borderRadius: 16,
              boxShadow: "0 2px 12px #7c3aed22",
              padding: 20,
              marginBottom: 24,
              transition: "box-shadow 0.2s",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Kullanıcı Bilgisi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#ede9fe",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#7c3aed",
                  fontSize: 18,
                }}
              >
                {profiles[p.user_id]?.avatar_url ? (
                  <img
                    src={profiles[p.user_id].avatar_url}
                    alt="pp"
                    style={{ width: 36, height: 36, objectFit: "cover" }}
                  />
                ) : (
                  p.user_id?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div style={{ fontWeight: 600, color: "#7c3aed", fontSize: 15 }}>
                {p.user_id?.slice(0, 8) + "..."}
              </div>
              <div style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
                {new Date(p.created_at).toLocaleString("tr-TR")}
              </div>
            </div>
            {p.media_url && (
              <img
                src={p.media_url}
                alt="görsel"
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              />
            )}
            <div style={{ fontWeight: 500, fontSize: 16, color: "#444" }}>
              {p.content}
            </div>
          </div>
        ))}

      {/* Reels Sekmesi - Scroll Snap */}
      {tab === "reel" && (
        <div
          ref={reelsContainerRef}
          style={{
            maxHeight: 600,
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {posts.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: "#000",
                borderRadius: 20,
                boxShadow: "0 2px 12px #7c3aed22",
                padding: 0,
                minHeight: 420,
                marginBottom: 8,
                overflow: "hidden",
                position: "relative",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              {p.media_url && (
                <video
                  src={p.media_url}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: 480,
                    display: "block",
                    background: "#111",
                  }}
                />
              )}
              {/* Kullanıcı Bilgisi ve Açıklama */}
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  color: "#fff",
                  background: "rgba(124,58,237,0.7)",
                  padding: "14px 18px",
                  borderRadius: 12,
                  fontWeight: 500,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  maxWidth: "90%",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#ede9fe",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#7c3aed",
                    fontSize: 20,
                  }}
                >
                  {profiles[p.user_id]?.avatar_url ? (
                    <img
                      src={profiles[p.user_id].avatar_url}
                      alt="pp"
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  ) : (
                    p.user_id?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {p.user_id?.slice(0, 8) + "..."}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#ede9fe", marginBottom: 2 }}
                  >
                    {p.content}
                  </div>
                  <div style={{ fontSize: 12, color: "#ede9fe" }}>
                    {new Date(p.created_at).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
