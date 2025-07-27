"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    getUserAndProfile();
  }, []);

  async function getUserAndProfile() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);
    if (userData.user) {
      // Profil verisini çek
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      setProfile(profileData);
      setBio(profileData?.bio || "");
      setAvatarUrl(profileData?.avatar_url || "");
      // Kullanıcının projelerini çek
      const { data: myProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setProjects(myProjects || []);

      // Takip verilerini çek
      await fetchFollowData(userData.user.id);
    }
    setLoading(false);
  }

  async function fetchFollowData(userId) {
    console.log("Takip verileri yükleniyor, userId:", userId);

    // Takipçileri çek
    const { data: followersData, error: followersError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    if (followersError) {
      console.error("Takipçi yükleme hatası:", followersError);
    }

    // Takip edilenleri çek
    const { data: followingData, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (followingError) {
      console.error("Takip edilen yükleme hatası:", followingError);
    }

    console.log("Takipçiler:", followersData);
    console.log("Takip edilenler:", followingData);

    setFollowersCount(followersData?.length || 0);
    setFollowingCount(followingData?.length || 0);

    // Takipçi kullanıcı bilgilerini çek
    if (followersData && followersData.length > 0) {
      const followerIds = followersData.map((f) => f.follower_id);
      console.log("Takipçi ID'leri:", followerIds);

      const { data: followerUsers, error: followerUsersError } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", followerIds);

      if (followerUsersError) {
        console.error(
          "Takipçi kullanıcı bilgileri hatası:",
          followerUsersError
        );
      }

      console.log("Takipçi kullanıcıları:", followerUsers);
      setFollowers(followerUsers || []);
    } else {
      setFollowers([]);
    }

    // Takip edilen kullanıcı bilgilerini çek
    if (followingData && followingData.length > 0) {
      const followingIds = followingData.map((f) => f.following_id);
      console.log("Takip edilen ID'leri:", followingIds);

      const { data: followingUsers, error: followingUsersError } =
        await supabase
          .from("profiles")
          .select("id, avatar_url")
          .in("id", followingIds);

      if (followingUsersError) {
        console.error(
          "Takip edilen kullanıcı bilgileri hatası:",
          followingUsersError
        );
      }

      console.log("Takip edilen kullanıcıları:", followingUsers);
      setFollowing(followingUsers || []);
    } else {
      setFollowing([]);
    }
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    let newAvatarUrl = avatarUrl;
    if (avatar) {
      const fileExt = avatar.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(`avatars/${fileName}`, avatar, { upsert: true });
      if (uploadError) {
        setMessage("Profil fotoğrafı yüklenemedi: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(`avatars/${fileName}`);
      newAvatarUrl = urlData.publicUrl;
      setAvatarUrl(newAvatarUrl);
    }
    // Profili güncelle veya oluştur
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      bio,
      avatar_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setMessage("Profil başarıyla güncellendi!");
      getUserAndProfile();
    } else {
      setMessage("Profil güncellenirken hata oluştu!");
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>Yükleniyor...</div>
    );
  if (!user)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Giriş yapmalısın.
      </div>
    );

  return (
    <div style={{ maxWidth: 540, margin: "40px auto" }}>
      {/* Kullanıcı Bilgileri ve Profil Düzenleme */}
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
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="pp"
              style={{ width: 72, height: 72, objectFit: "cover" }}
            />
          ) : (
            user.email[0].toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#7c3aed" }}>
            {user.email}
          </div>

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
          <form onSubmit={handleProfileUpdate} style={{ marginTop: 8 }}>
            <textarea
              placeholder="Kendini kısaca tanıt (bio)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              style={{ marginBottom: 8 }}
            />
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 18px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {saving ? "Kaydediliyor..." : "Profili Kaydet"}
            </button>
          </form>
          {message && (
            <div
              style={{
                color: message.includes("başarı") ? "green" : "red",
                marginTop: 6,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Kullanıcının Projeleri */}
      <div
        style={{
          marginBottom: 16,
          fontWeight: 600,
          color: "#7c3aed",
          fontSize: 18,
        }}
      >
        Projelerim
      </div>
      {projects.length === 0 && <div>Henüz hiç projen yok.</div>}
      {projects.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px #7c3aed22",
            padding: 20,
            marginBottom: 20,
            display: "flex",
            gap: 16,
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
              Henüz takipçin yok.
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
                      fontSize: 12,
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
                      follower.id.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {follower.id.slice(0, 8).toUpperCase()}
                  </span>
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
              Henüz kimseyi takip etmiyorsun.
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
                      fontSize: 12,
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
                      followed.id.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {followed.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
