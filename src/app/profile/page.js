"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
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
  const [userLikes, setUserLikes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    users: [],
    projects: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("newest");
  const [filterLikes, setFilterLikes] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    getUserAndProfile();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filterCategory, filterDate, filterLikes]);

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
      setUsername(profileData?.username || "");
      setAvatarUrl(profileData?.avatar_url || "");
      // Kullanıcının projelerini çek
      const { data: myProjects } = await supabase
        .from("projects")
        .select(
          `
          *,
          categories (
            id,
            name,
            slug,
            color,
            icon
          )
        `
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setProjects(myProjects || []);

      // Takip verilerini çek
      await fetchFollowData(userData.user.id);

      // Kullanıcının beğenilerini çek
      await fetchUserLikes(userData.user.id);
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
        .select("id, avatar_url, username")
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
          .select("id, avatar_url, username")
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

  async function fetchUserLikes(userId) {
    const { data: likes } = await supabase
      .from("project_likes")
      .select("project_id")
      .eq("user_id", userId);

    if (likes) {
      const likedProjects = new Set(likes.map((like) => like.project_id));
      setUserLikes(likedProjects);
    }
  }

  async function toggleLike(projectId, e) {
    e.stopPropagation(); // Proje kartına tıklamayı engelle
    if (!user) return;

    const isLiked = userLikes.has(projectId);

    try {
      if (isLiked) {
        // Beğeniyi kaldır
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("project_id", projectId)
          .eq("user_id", user.id);

        if (!error) {
          // Beğeni sayısını azalt
          await supabase.rpc("decrement_project_likes", {
            project_id: projectId,
          });

          // UI'yi güncelle
          const newLikes = new Set(userLikes);
          newLikes.delete(projectId);
          setUserLikes(newLikes);

          // Proje listesini yenile
          getUserAndProfile();
        }
      } else {
        // Beğeni ekle
        const { error } = await supabase
          .from("project_likes")
          .insert({ project_id: projectId, user_id: user.id });

        if (!error) {
          // Beğeni sayısını artır
          await supabase.rpc("increment_project_likes", {
            project_id: projectId,
          });

          // UI'yi güncelle
          const newLikes = new Set(userLikes);
          newLikes.add(projectId);
          setUserLikes(newLikes);

          // Proje listesini yenile
          getUserAndProfile();
        }
      }
    } catch (error) {
      console.error("Beğeni işlemi hatası:", error);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], projects: [] });
      return;
    }
    setIsSearching(true);
    try {
      // Kullanıcı arama
      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchQuery.trim()}%`)
        .limit(10);

      // Proje arama
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .or(
          `title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`
        )
        .limit(10);

      setSearchResults({ users: users || [], projects: projects || [] });
    } catch (error) {
      console.error("Arama hatası:", error);
      setSearchResults({ users: [], projects: [] });
    } finally {
      setIsSearching(false);
    }
  }

  function applyFilters() {
    let filtered = [...projects];

    // Kategori filtresi
    if (filterCategory) {
      filtered = filtered.filter(
        (project) => project.category_id === filterCategory
      );
    }

    // Tarih filtresi
    switch (filterDate) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "this_week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(
          (project) => new Date(project.created_at) >= weekAgo
        );
        break;
      case "this_month":
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(
          (project) => new Date(project.created_at) >= monthAgo
        );
        break;
    }

    // Beğeni filtresi
    switch (filterLikes) {
      case "most_liked":
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "least_liked":
        filtered.sort((a, b) => (a.likes || 0) - (b.likes || 0));
        break;
      case "no_likes":
        filtered = filtered.filter(
          (project) => !project.likes || project.likes === 0
        );
        break;
    }

    setFilteredProjects(filtered);
  }

  function startEditing(project) {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setEditCategory(project.category_id || "");
    setEditImage(null);
  }

  function cancelEditing() {
    setEditingProject(null);
    setEditTitle("");
    setEditDescription("");
    setEditCategory("");
    setEditImage(null);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditLoading(true);

    try {
      let image_url = editingProject.image_url;

      // Yeni görsel yüklendiyse
      if (editImage) {
        const fileExt = editImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(fileName, editImage, { upsert: true });

        if (uploadError) {
          setMessage("Görsel yüklenemedi: " + uploadError.message);
          setEditLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }

      // Projeyi güncelle
      const { error } = await supabase
        .from("projects")
        .update({
          title: editTitle,
          description: editDescription,
          category_id: editCategory,
          image_url: image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProject.id);

      if (!error) {
        setMessage("Proje başarıyla güncellendi!");
        cancelEditing();
        getUserAndProfile();
      } else {
        setMessage("Proje güncellenirken hata oluştu!");
      }
    } catch (error) {
      setMessage("Proje güncellenirken hata oluştu!");
      console.error("Düzenleme hatası:", error);
    }

    setEditLoading(false);
  }

  async function deleteProject(projectId) {
    if (!confirm("Bu projeyi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (!error) {
        setMessage("Proje başarıyla silindi!");
        getUserAndProfile();
      } else {
        setMessage("Proje silinirken hata oluştu!");
      }
    } catch (error) {
      setMessage("Proje silinirken hata oluştu!");
      console.error("Silme hatası:", error);
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
      username: username.trim(),
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

  // Logout fonksiyonu
  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Çıkış hatası:", error);
        return;
      }
      console.log("Başarıyla çıkış yapıldı");
      router.push("/login");
    } catch (error) {
      console.error("Çıkış işlemi hatası:", error);
    }
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
      {/* Navigation Butonları */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginBottom: 24,
        }}
      >
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

      {/* Filtreleme Sistemi */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #7c3aed22",
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 16, color: "#7c3aed" }}>
          🔍 Projelerimi Filtrele
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Kategori Filtresi */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              minWidth: 150,
            }}
          >
            <option value="">Tüm Kategoriler</option>
            <option value="web-development">💻 Web Geliştirme</option>
            <option value="mobile-app">📱 Mobil Uygulama</option>
            <option value="design">🎨 Tasarım</option>
            <option value="artificial-intelligence">🧠 Yapay Zeka</option>
            <option value="game-development">🎮 Oyun Geliştirme</option>
            <option value="data-analysis">📊 Veri Analizi</option>
            <option value="blockchain">⛓️ Blockchain</option>
            <option value="other">📁 Diğer</option>
          </select>

          {/* Tarih Filtresi */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="newest">📅 En Yeni</option>
            <option value="oldest">📅 En Eski</option>
            <option value="this_week">📅 Bu Hafta</option>
            <option value="this_month">📅 Bu Ay</option>
          </select>

          {/* Beğeni Filtresi */}
          <select
            value={filterLikes}
            onChange={(e) => setFilterLikes(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">❤️ Tümü</option>
            <option value="most_liked">❤️ En Popüler</option>
            <option value="least_liked">❤️ En Az Beğenilen</option>
            <option value="no_likes">❤️ Beğenisi Olmayan</option>
          </select>

          {/* Filtreleri Temizle */}
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterDate("newest");
              setFilterLikes("all");
            }}
            style={{
              padding: "8px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            🗑️ Temizle
          </button>
        </div>

        {/* Filtreleme Sonuç Sayısı */}
        <div style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
          {filteredProjects.length} proje bulundu
        </div>
      </div>

      {/* Arama Çubuğu */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #7c3aed22",
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Kullanıcı veya proje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 16,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              padding: "12px 20px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {isSearching ? "🔍" : "🔍"}
          </button>
        </div>

        {/* Arama Sonuçları */}
        {(searchResults.users.length > 0 ||
          searchResults.projects.length > 0) && (
          <div style={{ marginTop: 16 }}>
            {/* Kullanıcı Sonuçları */}
            {searchResults.users.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{ fontWeight: 600, marginBottom: 8, color: "#7c3aed" }}
                >
                  Kullanıcılar ({searchResults.users.length})
                </div>
                {searchResults.users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/profile/${user.id}`)}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="pp"
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                        />
                      ) : (
                        user.username?.[0]?.toUpperCase() ||
                        user.id.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#374151" }}>
                        {user.username || user.id.slice(0, 8).toUpperCase()}
                      </div>
                      {user.bio && (
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          {user.bio.length > 50
                            ? user.bio.substring(0, 50) + "..."
                            : user.bio}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Proje Sonuçları */}
            {searchResults.projects.length > 0 && (
              <div>
                <div
                  style={{ fontWeight: 600, marginBottom: 8, color: "#7c3aed" }}
                >
                  Projeler ({searchResults.projects.length})
                </div>
                {searchResults.projects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/project/${project.id}`)}
                  >
                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt="proje görseli"
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#374151" }}>
                        {project.title}
                      </div>
                      <div
                        style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}
                      >
                        {project.description &&
                          (project.description.length > 80
                            ? project.description.substring(0, 80) + "..."
                            : project.description)}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}
                      >
                        {new Date(project.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {searchQuery &&
          !isSearching &&
          searchResults.users.length === 0 &&
          searchResults.projects.length === 0 && (
            <div
              style={{ marginTop: 16, textAlign: "center", color: "#6b7280" }}
            >
              🔍 "{searchQuery}" için sonuç bulunamadı
            </div>
          )}
      </div>

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
            {username || user.email}
          </div>
          {username && (
            <div style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
              {user.email}
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
          <form onSubmit={handleProfileUpdate} style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Kullanıcı adı (örn: omeratik)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ddd",
                marginBottom: 8,
                fontSize: 14,
              }}
            />
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
      {filteredProjects.length === 0 && (
        <div>Bu kriterlere uygun proje bulunamadı.</div>
      )}
      {filteredProjects.map((p) => (
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
            {/* Kategori Etiketi */}
            {p.categories && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 8,
                  background: p.categories.color + "20",
                  color: p.categories.color,
                  border: `1px solid ${p.categories.color}40`,
                }}
              >
                {p.categories.icon} {p.categories.name}
              </div>
            )}
            {/* Beğeni Butonu */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                onClick={(e) => toggleLike(p.id, e)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ fontSize: 18 }}>
                  {userLikes.has(p.id) ? "❤️" : "🤍"}
                </span>
                <span style={{ fontSize: 14, color: "#666" }}>
                  {p.likes || 0}
                </span>
              </button>

              {/* Düzenleme ve Silme Butonları - Sadece Proje Sahibi */}
              {p.user_id === user?.id && (
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(p);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#7c3aed",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#ef4444",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#fef2f2")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    🗑️ Sil
                  </button>
                </div>
              )}
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
                    {follower.username || follower.id.slice(0, 8).toUpperCase()}
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
                    {followed.username || followed.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Modal */}
      {editingProject && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ color: "#7c3aed", margin: 0 }}>Proje Düzenle</h2>
              <button
                onClick={cancelEditing}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                placeholder="Proje başlığı"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              />
              <textarea
                placeholder="Açıklama (isteğe bağlı)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  resize: "vertical",
                }}
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  fontSize: 16,
                }}
              >
                <option value="">Kategori Seçin</option>
                <option value="web-development">💻 Web Geliştirme</option>
                <option value="mobile-app">📱 Mobil Uygulama</option>
                <option value="design">🎨 Tasarım</option>
                <option value="artificial-intelligence">🧠 Yapay Zeka</option>
                <option value="game-development">🎮 Oyun Geliştirme</option>
                <option value="data-analysis">📊 Veri Analizi</option>
                <option value="blockchain">⛓️ Blockchain</option>
                <option value="other">📁 Diğer</option>
              </select>

              {/* Mevcut Görsel */}
              {editingProject.image_url && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                    Mevcut Görsel:
                  </div>
                  <img
                    src={editingProject.image_url}
                    alt="mevcut görsel"
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files[0])}
                style={{ marginBottom: 12 }}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: "#7c3aed",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {editLoading ? "Güncelleniyor..." : "Güncelle"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
