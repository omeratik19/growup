"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [author, setAuthor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    users: [],
    projects: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProjectDetails();
    }
  }, [params.id]);

  async function fetchProjectDetails() {
    setLoading(true);
    setError("");

    try {
      // Proje detaylarını çek
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .single();

      if (projectError) {
        setError("Proje bulunamadı");
        setLoading(false);
        return;
      }

      setProject(projectData);

      // Proje sahibinin bilgilerini çek
      const { data: authorData, error: authorError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", projectData.user_id)
        .single();

      if (!authorError) {
        setAuthor(authorData);
      }

      // Mevcut kullanıcıyı kontrol et
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      // Yorumları çek
      await fetchComments(projectData.id);

      // Kullanıcının bu projeyi beğenip beğenmediğini kontrol et
      if (userData.user) {
        await checkUserLike(projectData.id, userData.user.id);
      }
    } catch (err) {
      setError("Bir hata oluştu");
      console.error("Proje detay yükleme hatası:", err);
    }

    setLoading(false);
  }

  // Yorumları çek
  async function fetchComments(projectId) {
    try {
      // Önce yorumları çek
      const { data: commentData, error: commentError } = await supabase
        .from("project_comments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (commentError) {
        console.error("Yorum yükleme hatası:", commentError);
        return;
      }

      if (!commentData || commentData.length === 0) {
        setComments([]);
        return;
      }

      // Yorum yapan kullanıcıların ID'lerini topla
      const userIds = [
        ...new Set(commentData.map((comment) => comment.user_id)),
      ];

      // Kullanıcı profillerini çek
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profileError) {
        console.error("Profil yükleme hatası:", profileError);
        return;
      }

      // Yorumları ve profilleri birleştir
      const commentsWithProfiles = commentData.map((comment) => {
        const profile = profileData.find((p) => p.id === comment.user_id);
        return {
          ...comment,
          profiles: profile || {
            id: comment.user_id,
            username: null,
            avatar_url: null,
          },
        };
      });

      setComments(commentsWithProfiles);
    } catch (err) {
      console.error("Yorum yükleme hatası:", err);
    }
  }

  // Kullanıcının beğeni durumunu kontrol et
  async function checkUserLike(projectId, userId) {
    const { data } = await supabase
      .from("project_likes")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    setIsLiked(!!data);
  }

  // Yorum ekle
  async function addComment(e) {
    e.preventDefault();

    if (!newComment.trim() || !user) {
      return;
    }

    setCommentLoading(true);

    try {
      const { error } = await supabase.from("project_comments").insert({
        project_id: params.id,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) {
        console.error("Yorum ekleme hatası:", error);
        return;
      }

      setNewComment("");
      await fetchComments(params.id);
    } catch (err) {
      console.error("Yorum ekleme hatası:", err);
    }

    setCommentLoading(false);
  }

  // Yorum sil
  async function deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from("project_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("Yorum silme hatası:", error);
        return;
      }

      await fetchComments(params.id);
    } catch (err) {
      console.error("Yorum silme hatası:", err);
    }
  }

  // Beğeni toggle
  async function toggleLike() {
    if (!user) return;

    try {
      if (isLiked) {
        // Beğeniyi kaldır
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("project_id", params.id)
          .eq("user_id", user.id);

        if (!error) {
          await supabase.rpc("decrement_project_likes", {
            project_id: params.id,
          });
          setIsLiked(false);
          // Proje bilgilerini yenile
          fetchProjectDetails();
        }
      } else {
        // Beğeni ekle
        const { error } = await supabase
          .from("project_likes")
          .insert({ project_id: params.id, user_id: user.id });

        if (!error) {
          await supabase.rpc("increment_project_likes", {
            project_id: params.id,
          });
          setIsLiked(true);
          // Proje bilgilerini yenile
          fetchProjectDetails();
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

  if (!project) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Proje bulunamadı.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
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
            Profil
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

      {/* Arama Çubuğu */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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

      {/* Proje Detayları */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Proje Görseli */}
        {project.image_url && (
          <div
            style={{
              width: "100%",
              height: 400,
              background: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={project.image_url}
              alt={project.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Proje İçeriği */}
        <div style={{ padding: 32 }}>
          {/* Başlık */}
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: 16,
            }}
          >
            {project.title}
          </h1>

          {/* Yazar Bilgisi */}
          {author && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                padding: "16px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt="pp"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  author.username?.[0]?.toUpperCase() ||
                  author.id.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#374151" }}>
                  {author.username || author.id.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  {new Date(project.created_at).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Açıklama */}
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "#374151",
              marginBottom: 32,
            }}
          >
            {project.description}
          </div>

          {/* Proje Meta Bilgileri */}
          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "20px 0",
              borderTop: "1px solid #e5e7eb",
              color: "#6b7280",
              fontSize: 14,
              alignItems: "center",
            }}
          >
            <div>
              <strong>Oluşturulma:</strong>{" "}
              {new Date(project.created_at).toLocaleString("tr-TR")}
            </div>
            {project.updated_at &&
              project.updated_at !== project.created_at && (
                <div>
                  <strong>Güncellenme:</strong>{" "}
                  {new Date(project.updated_at).toLocaleString("tr-TR")}
                </div>
              )}
            {/* Beğeni Butonu */}
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={toggleLike}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 20,
                  transition: "background 0.2s",
                  fontSize: 16,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ fontSize: 20 }}>{isLiked ? "❤️" : "🤍"}</span>
                <span style={{ color: "#6b7280" }}>
                  {project.likes || 0} beğeni
                </span>
              </button>
            </div>
          </div>

          {/* Proje Sahibi Kontrolü */}
          {user && project.user_id === user.id && (
            <div
              style={{
                marginTop: 24,
                padding: "16px",
                background: "#f3f4f6",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ fontWeight: 600, marginBottom: 8, color: "#374151" }}
              >
                Bu senin projen
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Projeni düzenlemek için profil sayfına git.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yorumlar Bölümü */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          marginTop: 32,
          overflow: "hidden",
        }}
      >
        {/* Yorum Başlığı */}
        <div
          style={{
            padding: "24px 32px 16px 32px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1f2937",
                margin: 0,
              }}
            >
              Yorumlar ({comments.length})
            </h3>
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                background: "none",
                border: "none",
                color: "#7c3aed",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {showComments ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>

        {/* Yorum Ekleme Formu */}
        {user && (
          <div style={{ padding: "16px 32px 24px 32px" }}>
            <form onSubmit={addComment}>
              <textarea
                placeholder="Yorumunuzu yazın..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                  marginBottom: 12,
                }}
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                style={{
                  padding: "10px 20px",
                  background:
                    commentLoading || !newComment.trim()
                      ? "#9ca3af"
                      : "#7c3aed",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor:
                    commentLoading || !newComment.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 14,
                }}
              >
                {commentLoading ? "Gönderiliyor..." : "Yorum Yap"}
              </button>
            </form>
          </div>
        )}

        {/* Yorumlar Listesi */}
        {showComments && (
          <div style={{ borderTop: "1px solid #e5e7eb" }}>
            {comments.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Henüz yorum yapılmamış. İlk yorumu sen yap!
              </div>
            ) : (
              <div>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "20px 32px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
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
                          fontSize: 14,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {comment.profiles?.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt="pp"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          comment.profiles?.username?.[0]?.toUpperCase() ||
                          comment.profiles?.id?.slice(0, 2).toUpperCase() ||
                          "U"
                        )}
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
                              color: "#374151",
                            }}
                          >
                            {comment.profiles?.username ||
                              comment.profiles?.id?.slice(0, 8).toUpperCase() ||
                              "Kullanıcı"}
                          </span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            {new Date(comment.created_at).toLocaleString(
                              "tr-TR"
                            )}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#374151",
                            lineHeight: 1.5,
                          }}
                        >
                          {comment.content}
                        </div>
                      </div>
                      {user && comment.user_id === user.id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: 12,
                            padding: "4px 8px",
                            borderRadius: 4,
                          }}
                          title="Yorumu sil"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
