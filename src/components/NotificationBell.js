"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Kullanıcı bilgisini al
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Bildirimleri yükle
    fetchNotifications();

    // Gerçek zamanlı dinleme
    const channel = supabase
      .channel("notifications")
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

  async function fetchNotifications() {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          from_user:from_user_id(username, avatar_url),
          project:project_id(title, image_url)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
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
        setUnreadCount((prev) => Math.max(0, prev - 1));
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
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Tüm bildirimleri okundu işaretleme hatası:", error);
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

  return (
    <div style={{ position: "relative" }}>
      {/* Bildirim Zili */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          borderRadius: "50%",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: "24px" }}>🔔</span>

        {/* Okunmamış Bildirim Sayacı */}
        {unreadCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              minWidth: "20px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Bildirim Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: "350px",
            maxHeight: "500px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, color: "#374151", fontWeight: "600" }}>
              Bildirimler
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7c3aed",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {loading ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                Yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                Henüz bildirimin yok
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    background: notification.is_read ? "#fff" : "#f8fafc",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#f1f5f9")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = notification.is_read
                      ? "#fff"
                      : "#f8fafc")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Bildirim İkonu */}
                    <div style={{ fontSize: "20px", marginTop: "2px" }}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Bildirim İçeriği */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          color: notification.is_read ? "#6b7280" : "#374151",
                          fontWeight: notification.is_read ? "400" : "500",
                          lineHeight: "1.4",
                        }}
                      >
                        {notification.message}
                      </div>

                      {/* Zaman */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginTop: "4px",
                        }}
                      >
                        {formatTimeAgo(notification.created_at)}
                      </div>

                      {/* Proje Görseli (varsa) */}
                      {notification.project && (
                        <div style={{ marginTop: "8px" }}>
                          <img
                            src={notification.project.image_url}
                            alt="proje"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Okunmamış İndikatör */}
                    {!notification.is_read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "#7c3aed",
                          borderRadius: "50%",
                          marginTop: "4px",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = "/notifications";
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7c3aed",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Tümünü Gör
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dışarı tıklama ile kapatma */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
