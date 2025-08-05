"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import NotificationBell from "../../components/NotificationBell";
import ChatSystem from "../../components/ChatSystem";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgisini al
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    fetchProjects();
    fetchUserLikes();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filterCategory, filterDate, filterLikes]);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Her proje için kullanıcı bilgisini al
      const projectsWithUsers = await Promise.all(
        data.map(async (project) => {
          if (project.user_id) {
            const { data: userData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", project.user_id)
              .single();

            return {
              ...project,
              userProfile: userData,
            };
          }
          return project;
        })
      );
      setProjects(projectsWithUsers);
    }
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

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) {
      setCategories(data);
      // Varsayılan kategori seç
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
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
      category_id: selectedCategory,
    });
    if (!error) {
      setMessage("Proje başarıyla eklendi!");
      setTitle("");
      setDescription("");
      setImage(null);
      setSelectedCategory(categories.length > 0 ? categories[0].id : "");
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
        fetchProjects();
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
        fetchProjects();
      } else {
        setMessage("Proje silinirken hata oluştu!");
      }
    } catch (error) {
      setMessage("Proje silinirken hata oluştu!");
      console.error("Silme hatası:", error);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#7c3aed",
            }}
          >
            <span style={{ fontSize: "20px" }}>🌱</span>
            <span>Growhub</span>
          </div>

          {/* Search Bar */}
          <div
            style={{
              flex: 1,
              maxWidth: "500px",
              margin: "0 24px",
              position: "relative",
            }}
          >
            <input
              type="text"
              placeholder="Kullanıcı, proje veya teknoloji ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);

                // Önceki timeout'u temizle
                if (searchTimeout) {
                  clearTimeout(searchTimeout);
                }

                if (e.target.value.trim()) {
                  // 300ms sonra arama yap
                  const timeout = setTimeout(() => {
                    handleSearch();
                  }, 300);
                  setSearchTimeout(timeout);
                } else {
                  setSearchResults({ users: [], projects: [] });
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "24px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                background: "#f9fafb",
                outline: "none",
              }}
            />

            {/* Arama Sonuçları Dropdown */}
            {searchQuery && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginTop: "8px",
                }}
              >
                {/* Kullanıcı Sonuçları */}
                {searchResults.users.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: "12px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      👥 Kullanıcılar
                    </div>
                    {searchResults.users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          router.push(`/profile/${user.id}`);
                          setSearchQuery("");
                          setSearchResults({ users: [], projects: [] });
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {user.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            {user.username || "Kullanıcı"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proje Sonuçları */}
                {searchResults.projects.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: "12px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      🚀 Projeler
                    </div>
                    {searchResults.projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => {
                          router.push(`/project/${project.id}`);
                          setSearchQuery("");
                          setSearchResults({ users: [], projects: [] });
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                      >
                        {project.image_url && (
                          <img
                            src={project.image_url}
                            alt={project.title}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            {project.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {project.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sonuç Bulunamadı */}
                {searchQuery &&
                  searchResults.users.length === 0 &&
                  searchResults.projects.length === 0 &&
                  !isSearching && (
                    <div
                      style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      🔍 "{searchQuery}" için sonuç bulunamadı
                    </div>
                  )}

                {/* Arama Yükleniyor */}
                {isSearching && (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    🔍 Aranıyor...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => router.push("/explore")}
              style={{
                background: "#ede9fe",
                color: "#7c3aed",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#d1c4e9")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#ede9fe")}
            >
              🔍 Keşfet
            </button>
            <button
              onClick={() => router.push("/music")}
              style={{
                background: "#fef3c7",
                color: "#d97706",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#fde68a")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#fef3c7")}
            >
              🎵 Müzik
            </button>
            <button
              onClick={() => router.push("/ai")}
              style={{
                background: "linear-gradient(45deg, #00ffff, #00ff88)",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)",
              }}
              onMouseOver={(e) => {
                e.target.style.boxShadow = "0 0 25px rgba(0, 255, 255, 0.6)";
              }}
              onMouseOut={(e) => {
                e.target.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.4)";
              }}
            >
              🤖 GrowAI
            </button>
            <button
              onClick={() => setTitle("")}
              style={{
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#6d28d9")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#7c3aed")}
            >
              + Proje Ekle
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#dc2626")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
            >
              Çıkış Yap
            </button>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              {user?.email ? user.email.split("@")[0] : "atkcodes"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px",
          gap: "24px",
        }}
      >
        {/* Left Sidebar - Categories */}
        <div
          style={{
            width: "250px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Kategoriler
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={() => setFilterCategory("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: filterCategory === "" ? "#f3e8ff" : "transparent",
                  color: filterCategory === "" ? "#7c3aed" : "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: filterCategory === "" ? "600" : "500",
                  transition: "all 0.2s",
                }}
              >
                <span>🏠</span>
                <span>Tümü</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilterCategory(category.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      filterCategory === category.id
                        ? "#f3e8ff"
                        : "transparent",
                    color:
                      filterCategory === category.id ? "#7c3aed" : "#374151",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: filterCategory === category.id ? "600" : "500",
                    transition: "all 0.2s",
                  }}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "20px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Son Paylaşımlar
            </h2>

            {/* Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {["all", "projects", "posts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: activeTab === tab ? "#7c3aed" : "transparent",
                    color: activeTab === tab ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                >
                  {tab === "all"
                    ? "Tümü"
                    : tab === "projects"
                    ? "Projeler"
                    : "Gönderiler"}
                </button>
              ))}
            </div>

            {/* Share Content Section */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <button
                  onClick={() => {
                    setShowProjectForm(true);
                    setShowPostForm(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: showProjectForm ? "#7c3aed" : "#e5e7eb",
                    color: showProjectForm ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                >
                  Proje Paylaş
                </button>
                <button
                  onClick={() => {
                    setShowPostForm(true);
                    setShowProjectForm(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: showPostForm ? "#7c3aed" : "#e5e7eb",
                    color: showPostForm ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                >
                  Gönderi Paylaş
                </button>
              </div>

              {showProjectForm && (
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Proje başlığı"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "12px",
                      fontSize: "14px",
                    }}
                  />
                  <textarea
                    placeholder="Proje açıklaması (isteğe bağlı)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "12px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "12px",
                      fontSize: "14px",
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "16px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#7c3aed",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#6d28d9")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#7c3aed")
                    }
                  >
                    {loading ? "Ekleniyor..." : "Projeni Paylaş"}
                  </button>
                </form>
              )}

              {showPostForm && (
                <div style={{ textAlign: "center", color: "#6b7280" }}>
                  Gönderi paylaşma özelliği yakında gelecek! 🚀
                </div>
              )}
            </div>

            {/* Content Feed */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {loading && (
                <div style={{ textAlign: "center", color: "#6b7280" }}>
                  Yükleniyor...
                </div>
              )}
              {!loading && filteredProjects.length === 0 && (
                <div style={{ textAlign: "center", color: "#6b7280" }}>
                  Bu kriterlere uygun proje bulunamadı.
                </div>
              )}
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/project/${project.id}`)}
                  style={{
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    {/* Proje Görseli */}
                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        style={{
                          width: "160px",
                          height: "160px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "16px",
                            fontWeight: "600",
                            overflow: "hidden",
                          }}
                        >
                          {project.userProfile?.avatar_url ? (
                            <img
                              src={project.userProfile.avatar_url}
                              alt="avatar"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            (
                              project.userProfile?.username?.[0] || "U"
                            ).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            {project.userProfile?.username || "Kullanıcı"}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {new Date(project.created_at).toLocaleString(
                              "tr-TR"
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "4px",
                        }}
                      >
                        {project.title}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        {project.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: "250px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Trend Projeler
            </h3>
            <div
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
                padding: "20px 0",
              }}
            >
              Henüz trend proje yok
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Önerilen Kullanıcılar
            </h3>
            <div
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
                padding: "20px 0",
              }}
            >
              Henüz önerilen kullanıcı yok
            </div>
          </div>
        </div>
      </div>

      {/* Chat İkonu - Sağ Alt Köşe */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#7c3aed",
            border: "none",
            color: "#fff",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#6d28d9";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#7c3aed";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          💬
        </button>
      </div>

      {/* Chat Sistemi */}
      <ChatSystem isOpen={isOpen} setIsOpen={setIsOpen} />

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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
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
