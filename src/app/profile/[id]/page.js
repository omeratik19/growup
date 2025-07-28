"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchUserProfile();
      fetchCurrentUser();
    }
  }, [params.id]);

  async function fetchCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchUserProfile() {
    setLoading(true);
    setError("");

    try {
      // Kullanıcı profilini çek
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (profileError) {
        setError("Kullanıcı bulunamadı");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Kullanıcının projelerini çek
      const { data: userProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false });

      setProjects(userProjects || []);

      // Takip verilerini çek
      await fetchFollowData(params.id);

      // Mevcut kullanıcının bu kullanıcıyı takip edip etmediğini kontrol et
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: followCheck } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", params.id)
          .single();

        setIsFollowing(!!followCheck);
      }
    } catch (err) {
      setError("Bir hata oluştu");
      console.error("Kullanıcı profil yükleme hatası:", err);
    }

    setLoading(false);
  }

  async function fetchFollowData(userId) {
    // Takipçileri çek
    const { data: followersData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    // Takip edilenleri çek
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    setFollowersCount(followersData?.length || 0);
    setFollowingCount(followingData?.length || 0);

    // Takipçi kullanıcı bilgilerini çek
    if (followersData && followersData.length > 0) {
      const followerIds = followersData.map((f) => f.follower_id);
      const { data: followerUsers } = await supabase
        .from("profiles")
        .select("id, avatar_url, username")
        .in("id", followerIds);
      setFollowers(followerUsers || []);
    }

    // Takip edilen kullanıcı bilgilerini çek
    if (followingData && followingData.length > 0) {
      const followingIds = followingData.map((f) => f.following_id);
      const { data: followingUsers } = await supabase
        .from("profiles")
        .select("id, avatar_url, username")
        .in("id", followingIds);
      setFollowing(followingUsers || []);
    }
  }

  async function toggleFollow() {
    if (!currentUser) {
      // Oturum açmamış kullanıcılar için localStorage kullan
      const anonymousFollows = JSON.parse(
        localStorage.getItem("anonymousFollows") || "[]"
      );

      if (isFollowing) {
        const newFollows = anonymousFollows.filter((id) => id !== params.id);
        localStorage.setItem("anonymousFollows", JSON.stringify(newFollows));
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        const newFollows = [...anonymousFollows, params.id];
        localStorage.setItem("anonymousFollows", JSON.stringify(newFollows));
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
      return;
    }

    try {
      if (isFollowing) {
        // Takibi bırak
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", params.id);

        if (!error) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
          await fetchFollowData(params.id);
        }
      } else {
        // Takip et
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: params.id });

        if (!error) {
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
          await fetchFollowData(params.id);
        }
      }
    } catch (error) {
      console.error("Takip işlemi hatası:", error);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Çıkış hatası:", error);
        return;
      }
      router.push("/login");
    } catch (error) {
      console.error("Çıkış işlemi hatası:", error);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>Yükleniyor...</div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ color: "red", marginBottom: 20 }}>{error}</div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "10px 20px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Kullanıcı bulunamadı.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: "40px auto" }}>
      {/* Navigation Butonları */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Anasayfa
          </button>
          <button
            onClick={() => router.push("/explore")}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Keşfet
          </button>
          <button
            onClick={() => router.push("/profile")}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Profilim
          </button>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Çıkış
        </button>
      </div>

      {/* Kullanıcı Bilgileri */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #7c3aed22",
          padding: 24,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#ede9fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            color: "#7c3aed",
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="pp"
              style={{ width: 72, height: 72, objectFit: "cover" }}
            />
          ) : (
            profile.username?.[0]?.toUpperCase() ||
            profile.id.slice(0, 2).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#7c3aed" }}>
            {profile.username || profile.id.slice(0, 8).toUpperCase()}
          </div>
          {profile.bio && (
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              {profile.bio}
            </div>
          )}

          {/* Takip Sayıları */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#333" }}>
                {projects.length}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>Proje</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#333" }}>
                {followersCount}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>Takipçi</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#333" }}>
                {followingCount}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>Takip</div>
            </div>
          </div>

          {/* Takip Butonu */}
          {currentUser && currentUser.id !== params.id && (
            <button
              onClick={toggleFollow}
              style={{
                padding: "8px 20px",
                background: isFollowing ? "#ef4444" : "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = isFollowing
                  ? "#dc2626"
                  : "#5b21b6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = isFollowing
                  ? "#ef4444"
                  : "#7c3aed")
              }
            >
              {isFollowing ? "Takibi Bırak" : "Takip Et"}
            </button>
          )}
        </div>
      </div>

      {/* Kullanıcının Projeleri */}
      <div
        style={{
          marginBottom: 32,
        }}
      >
        <div
          style={{
            marginBottom: 16,
            fontWeight: 600,
            color: "#7c3aed",
            fontSize: 18,
          }}
        >
          Projeler ({projects.length})
        </div>
        {projects.length === 0 && <div>Henüz hiç proje yok.</div>}
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/project/${p.id}`)}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px #7c3aed22",
              padding: 20,
              marginBottom: 20,
              display: "flex",
              gap: 16,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 20px #7c3aed33";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px #7c3aed22";
            }}
          >
            {p.image_url && (
              <img
                src={p.image_url}
                alt="proje görseli"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#7c3aed" }}>
                {p.title}
              </div>
              <div style={{ color: "#444", margin: "6px 0 4px 0" }}>
                {p.description}
              </div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {new Date(p.created_at).toLocaleString("tr-TR")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Takipçiler ve Takip Edilenler */}
      <div style={{ marginTop: 32 }}>
        {/* Takipçiler */}
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              marginBottom: 16,
              fontWeight: 600,
              color: "#7c3aed",
              fontSize: 18,
            }}
          >
            Takipçiler ({followersCount})
          </div>
          {followers.length === 0 ? (
            <div style={{ color: "#666", textAlign: "center", padding: 20 }}>
              Henüz takipçi yok.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    padding: "8px 12px",
                    borderRadius: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/profile/${follower.id}`)}
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
                    }}
                  >
                    {follower.avatar_url ? (
                      <img
                        src={follower.avatar_url}
                        alt="pp"
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      follower.username?.[0]?.toUpperCase() ||
                      follower.id.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {follower.username || follower.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Takip Edilenler */}
        <div>
          <div
            style={{
              marginBottom: 16,
              fontWeight: 600,
              color: "#7c3aed",
              fontSize: 18,
            }}
          >
            Takip Edilenler ({followingCount})
          </div>
          {following.length === 0 ? (
            <div style={{ color: "#666", textAlign: "center", padding: 20 }}>
              Henüz kimseyi takip etmiyor.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {following.map((followed) => (
                <div
                  key={followed.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    padding: "8px 12px",
                    borderRadius: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/profile/${followed.id}`)}
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
                    }}
                  >
                    {followed.avatar_url ? (
                      <img
                        src={followed.avatar_url}
                        alt="pp"
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      followed.username?.[0]?.toUpperCase() ||
                      followed.id.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {followed.username || followed.id.slice(0, 8).toUpperCase()}
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
