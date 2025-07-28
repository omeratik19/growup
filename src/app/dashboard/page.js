"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userLikes, setUserLikes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    users: [],
    projects: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    fetchUserLikes();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProjects(data);
    setLoading(false);
  }

  async function fetchUserLikes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: likes } = await supabase
      .from("project_likes")
      .select("project_id")
      .eq("user_id", user.id);

    if (likes) {
      const likedProjects = new Set(likes.map((like) => like.project_id));
      setUserLikes(likedProjects);
    }
  }

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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    let image_url = null;
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, image, { upsert: true });
      if (uploadError) {
        setMessage("Görsel yüklenemedi: " + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);
      image_url = urlData.publicUrl;
    }
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title,
      description,
      image_url,
    });
    if (!error) {
      setMessage("Proje başarıyla eklendi!");
      setTitle("");
      setDescription("");
      setImage(null);
      fetchProjects();
    } else {
      setMessage("Proje eklenirken hata oluştu!");
    }
    setLoading(false);
  }

  async function toggleLike(projectId, e) {
    e.stopPropagation(); // Proje kartına tıklamayı engelle
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
          fetchProjects();
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
          fetchProjects();
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

  return (
    <div style={{ maxWidth: 540, margin: "40px auto" }}>
      {/* Üstte Keşfet ve Profilim Butonları */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => router.push("/explore")}
          style={{
            background: "#ede9fe",
            color: "#7c3aed",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 12px #7c3aed22",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#d1c4e9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ede9fe")}
        >
          Keşfet
        </button>
        <button
          onClick={() => router.push("/profile")}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 12px #7c3aed22",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#5b21b6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#7c3aed")}
        >
          Profilim
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 12px #ef444422",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
        >
          Çıkış
        </button>
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

      {/* Proje Ekleme Kutusu */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #7c3aed22",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ color: "#7c3aed", marginBottom: 12 }}>Proje Ekle</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Proje başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginBottom: 12 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {loading ? "Ekleniyor..." : "Projeni Paylaş"}
          </button>
        </form>
        {message && (
          <div
            style={{
              color: message.includes("başarı") ? "green" : "red",
              marginTop: 10,
            }}
          >
            {message}
          </div>
        )}
      </div>
      <div>
        {loading && <div>Yükleniyor...</div>}
        {!loading && projects.length === 0 && <div>Henüz hiç proje yok.</div>}
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
