"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgisini al
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    }
    getUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Bildirimleri yükle
    fetchNotifications();

    // Gerçek zamanlı dinleme
    const channel = supabase
      .channel("notifications_page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Bildirim değişikliği:", payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Filter değiştiğinde bildirimleri yeniden yükle
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [filter]);

  async function fetchNotifications() {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("notifications")
        .select(
          `
          *,
          from_user:from_user_id(username, avatar_url),
          project:project_id(title, image_url)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Filtre uygula
      if (filter === "unread") {
        query = query.eq("is_read", false);
      } else if (filter === "read") {
        query = query.eq("is_read", true);
      }

      const { data, error } = await query;

      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Bildirim yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Bildirim okundu işaretleme hatası:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Tüm bildirimleri okundu işaretleme hatası:", error);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Bildirim silme hatası:", error);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "follow":
        return "👥";
      case "project_shared":
        return "🚀";
      default:
        return "🔔";
    }
  }

  function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Az önce";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d önce`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}s önce`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}g önce`;
    return date.toLocaleDateString("tr-TR");
  }

  function handleNotificationClick(notification) {
    // Bildirimi okundu işaretle
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Proje bildirimi ise proje sayfasına git
    if (notification.project_id) {
      router.push(`/project/${notification.project_id}`);
    }
    // Takip bildirimi ise profil sayfasına git
    else if (notification.from_user_id) {
      router.push(`/profile/${notification.from_user_id}`);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              color: "#7c3aed",
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
            }}
          >
            🔔 Bildirimler
          </h1>
          <p style={{ color: "#6b7280", margin: "8px 0 0 0" }}>
            Tüm bildirimlerinizi buradan yönetebilirsiniz
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "#ede9fe",
              color: "#7c3aed",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#d1c4e9")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ede9fe")}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #7c3aed22",
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === "all" ? "#7c3aed" : "#f3f4f6",
                color: filter === "all" ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Tümü ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === "unread" ? "#7c3aed" : "#f3f4f6",
                color: filter === "unread" ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Okunmamış ({notifications.filter((n) => !n.is_read).length})
            </button>
            <button
              onClick={() => setFilter("read")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === "read" ? "#7c3aed" : "#f3f4f6",
                color: filter === "read" ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Okunmuş ({notifications.filter((n) => n.is_read).length})
            </button>
          </div>

          {notifications.filter((n) => !n.is_read).length > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#10b981",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#059669")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#10b981")}
            >
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
      </div>

      {/* Bildirim Listesi */}
      <div>
        {loading ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px #7c3aed22",
              padding: 40,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Yükleniyor...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px #7c3aed22",
              padding: 40,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>
              Henüz bildirimin yok
            </h3>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Yeni aktiviteler olduğunda burada görünecek
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 12px #7c3aed22",
                padding: 20,
                marginBottom: 16,
                border: notification.is_read
                  ? "1px solid #e5e7eb"
                  : "2px solid #7c3aed",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onClick={() => handleNotificationClick(notification)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 20px #7c3aed33";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px #7c3aed22";
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                {/* Bildirim İkonu */}
                <div style={{ fontSize: "24px", marginTop: "4px" }}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Bildirim İçeriği */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      color: notification.is_read ? "#6b7280" : "#374151",
                      fontWeight: notification.is_read ? "400" : "600",
                      lineHeight: "1.5",
                      marginBottom: "8px",
                    }}
                  >
                    {notification.message}
                  </div>

                  {/* Zaman */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      marginBottom: "12px",
                    }}
                  >
                    {formatTimeAgo(notification.created_at)}
                  </div>

                  {/* Proje Görseli (varsa) */}
                  {notification.project && (
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={notification.project.image_url}
                        alt="proje"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: "600", color: "#374151" }}>
                          {notification.project.title}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          Projeyi görüntüle →
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kullanıcı Avatarı (varsa) */}
                  {notification.from_user && (
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        marginTop: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        {notification.from_user.avatar_url ? (
                          <img
                            src={notification.from_user.avatar_url}
                            alt="avatar"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          notification.from_user.username?.[0]?.toUpperCase() ||
                          "U"
                        )}
                      </div>
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        {notification.from_user.username} kullanıcısını
                        görüntüle →
                      </div>
                    </div>
                  )}
                </div>

                {/* Aksiyon Butonları */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {/* Okunmamış İndikatör */}
                  {!notification.is_read && (
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        background: "#7c3aed",
                        borderRadius: "50%",
                      }}
                    />
                  )}

                  {/* Silme Butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: "4px",
                      borderRadius: "4px",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#fef2f2")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
