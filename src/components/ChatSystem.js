"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChatSystem() {
  console.log("ChatSystem component render ediliyor");

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);

  // currentConversation değişikliklerini izle
  useEffect(() => {
    console.log("currentConversation değişti:", currentConversation);
  }, [currentConversation]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
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
    console.log("ChatSystem useEffect başladı, user:", user.id);
    fetchConversations();

    // Polling sistemi - her 2 saniyede bir kontrol et
    const pollingInterval = setInterval(() => {
      if (currentConversation && messages.length > 0) {
        console.log("🔄 Polling: Mesajlar kontrol ediliyor...");
        fetchMessages(currentConversation.id);
      }
    }, 2000);

    // Gerçek zamanlı mesaj dinleme - tüm mesajları dinle
    console.log("Real-time subscription kuruluyor...");
    const channel = supabase
      .channel("chat_system")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🎯 REAL-TIME MESAJ ALINDI:", payload);
          console.log("Event type:", payload.eventType);
          console.log("New data:", payload.new);
          console.log("Current conversation:", currentConversation?.id);

          // Yeni mesaj geldiğinde ve mevcut sohbetle ilgiliyse güncelle
          if (payload.eventType === "INSERT" && currentConversation) {
            const newMessage = payload.new;
            console.log(
              "Yeni mesaj conversation_id:",
              newMessage.conversation_id
            );
            console.log("Current conversation_id:", currentConversation.id);

            if (newMessage.conversation_id === currentConversation.id) {
              console.log("✅ Mesaj mevcut sohbete ait, UI güncelleniyor...");
              setMessages((prevMessages) => {
                // Mesaj zaten var mı kontrol et (daha sıkı kontrol)
                const exists = prevMessages.find(
                  (msg) =>
                    msg.id === newMessage.id &&
                    msg.content === newMessage.content
                );
                if (exists) {
                  console.log("⚠️ Mesaj zaten mevcut, güncelleme yapılmıyor");
                  return prevMessages;
                }

                console.log("➕ Yeni mesaj UI'a ekleniyor");
                return [...prevMessages, newMessage];
              });
            } else {
              console.log("❌ Mesaj farklı sohbete ait, güncelleme yapılmıyor");
            }
          }

          // Sohbet listesini güncelle
          console.log("🔄 Sohbet listesi güncelleniyor...");
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription durumu:", status);
      });

    return () => {
      console.log("🔌 Real-time subscription kapatılıyor...");
      clearInterval(pollingInterval); // Polling'i durdur
      supabase.removeChannel(channel);
    };
  }, [user, currentConversation?.id]);

  async function fetchConversations() {
    if (!user) return;
    console.log("fetchConversations başladı");

    try {
      // Kullanıcının sohbetlerini al
      const { data: userConversations, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      console.log("fetchConversations sonucu:", { userConversations, error });

      if (!error && userConversations && userConversations.length > 0) {
        const conversationIds = userConversations.map((c) => c.conversation_id);

        // Sohbetleri formatla
        const formattedConversations = [];

        for (const convId of conversationIds) {
          // Her sohbet için diğer kullanıcıyı ayrı ayrı al
          const { data: otherParticipants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", convId)
            .neq("user_id", user.id)
            .limit(1);

          if (otherParticipants && otherParticipants.length > 0) {
            const otherUserId = otherParticipants[0].user_id;

            // Kullanıcı bilgisini al
            const { data: otherUser } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", otherUserId)
              .single();

            if (otherUser) {
              formattedConversations.push({
                id: convId,
                otherUser: otherUser,
                lastMessage: null,
                unreadCount: 0,
              });
            }
          }
        }

        setConversations(formattedConversations);
        setUnreadCount(0);
        console.log("Sohbetler yüklendi:", formattedConversations.length);
      } else {
        setConversations([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Sohbet yükleme hatası:", error);
      setConversations([]);
      setUnreadCount(0);
    }
  }

  async function fetchMessages(conversationId) {
    if (!conversationId) return;
    console.log("fetchMessages başladı:", conversationId);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      console.log("fetchMessages sonucu:", { data, error });

      if (!error && data) {
        // Sender bilgilerini manuel olarak ekle
        const messagesWithSenders = await Promise.all(
          data.map(async (message) => {
            const { data: senderData } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", message.sender_id)
              .single();

            return {
              ...message,
              sender: senderData || {
                id: message.sender_id,
                username: "Bilinmeyen Kullanıcı",
                avatar_url: null,
              },
            };
          })
        );

        setMessages(messagesWithSenders);
        console.log("Mesajlar yüklendi:", messagesWithSenders.length);

        // Mesajları okundu olarak işaretle
        const unreadMessages = data.filter(
          (m) => !m.is_read && m.sender_id !== user.id
        );
        if (unreadMessages.length > 0) {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .in(
              "id",
              unreadMessages.map((m) => m.id)
            );
        }
      }
    } catch (error) {
      console.error("Mesaj yükleme hatası:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentConversation) return;

    const messageContent = newMessage.trim();
    console.log("Mesaj gönderiliyor:", {
      conversation_id: currentConversation.id,
      sender_id: user.id,
      content: messageContent,
    });

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          sender_id: user.id,
          content: messageContent,
          is_read: false,
        })
        .select("*");

      console.log("Mesaj gönderme sonucu:", { data, error });

      if (!error && data) {
        setNewMessage("");

        // Sender bilgisini manuel olarak ekle
        const newMessageWithSender = {
          ...data[0],
          sender: {
            id: user.id,
            username: user.email?.split("@")[0] || "user",
            avatar_url: null,
          },
        };

        setMessages((prev) => [...prev, newMessageWithSender]);
        console.log("Mesaj başarıyla gönderildi ve UI'da gösterildi!");

        // Sohbet listesini güncelle
        fetchConversations();
      } else {
        console.error("Mesaj gönderme hatası:", error);
      }
    } catch (error) {
      console.error("Mesaj gönderme catch hatası:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startConversation(otherUserId) {
    console.log("startConversation başladı:", otherUserId);
    try {
      const { data: otherUser } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", otherUserId)
        .single();

      console.log("Kullanıcı bilgisi alındı:", otherUser);

      // Önce mevcut sohbet var mı kontrol et
      const { data: existingConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const { data: otherUserConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId);

      const userConvIds =
        existingConversations?.map((c) => c.conversation_id) || [];
      const otherUserConvIds =
        otherUserConversations?.map((c) => c.conversation_id) || [];

      const commonConversationId = userConvIds.find((id) =>
        otherUserConvIds.includes(id)
      );

      if (commonConversationId) {
        console.log("Mevcut sohbet bulundu:", commonConversationId);
        const existingConv = {
          id: commonConversationId,
          otherUser: otherUser,
          lastMessage: null,
          unreadCount: 0,
        };
        setCurrentConversation(existingConv);
        fetchMessages(commonConversationId);
        return;
      }

      console.log("Yeni sohbet oluşturuluyor...");
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (!convError && newConversation) {
        console.log("Yeni sohbet oluşturuldu:", newConversation.id);
        await supabase.from("conversation_participants").insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: otherUserId },
        ]);

        const newConv = {
          id: newConversation.id,
          otherUser: otherUser,
          lastMessage: null,
          unreadCount: 0,
        };

        console.log("currentConversation ayarlanıyor:", newConv);
        setCurrentConversation(newConv);
        fetchMessages(newConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Sohbet başlatma hatası:", error);
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("tr-TR");
    }
  }

  async function fetchUsers() {
    console.log("fetchUsers başladı");
    if (!user) {
      console.log("Kullanıcı yok, fetchUsers iptal");
      return;
    }

    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .neq("id", user.id)
        .order("username");

      console.log("fetchUsers sonucu:", { data, error });

      if (!error && data) {
        setUsers(data);
        console.log("Kullanıcılar yüklendi:", data.length);
      }
    } catch (error) {
      console.error("Kullanıcıları getirme hatası:", error);
    } finally {
      setLoadingUsers(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
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
        <span style={{ fontSize: "24px" }}>💬</span>
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

      {isOpen && (
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
              borderRadius: "12px",
              width: "90%",
              maxWidth: "800px",
              height: "80%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
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
                💬 Mesajlar
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  width: "300px",
                  borderRight: "1px solid #e5e7eb",
                  overflowY: "auto",
                }}
              >
                {showUserList ? (
                  <div>
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4 style={{ margin: 0, color: "#374151" }}>
                        Kullanıcılar
                      </h4>
                      <button
                        onClick={() => {
                          setShowUserList(false);
                          setUsers([]);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#666",
                          fontSize: "16px",
                        }}
                      >
                        ← Geri
                      </button>
                    </div>

                    {loadingUsers ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        Kullanıcılar yükleniyor...
                      </div>
                    ) : users.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <button
                          onClick={() => {
                            console.log(
                              "Kullanıcıları Göster butonuna tıklandı"
                            );
                            fetchUsers();
                          }}
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Kullanıcıları Göster
                        </button>
                      </div>
                    ) : (
                      users.map((userItem) => (
                        <div
                          key={userItem.id}
                          onClick={async () => {
                            console.log("Kullanıcıya tıklandı:", userItem);
                            await startConversation(userItem.id);
                            console.log("startConversation tamamlandı");
                          }}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f3f4f6",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#f1f5f9")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#fff")
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
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
                              {userItem.avatar_url ? (
                                <img
                                  src={userItem.avatar_url}
                                  alt="avatar"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                  }}
                                />
                              ) : (
                                userItem.username?.[0]?.toUpperCase() || "U"
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{ fontWeight: "600", color: "#374151" }}
                              >
                                {userItem.username}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : conversations.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      Henüz sohbetin yok
                    </div>
                    <button
                      onClick={() => setShowUserList(true)}
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      💬 Yeni Sohbet Başlat
                    </button>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        setCurrentConversation(conversation);
                        fetchMessages(conversation.id);
                      }}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        cursor: "pointer",
                        background:
                          currentConversation?.id === conversation.id
                            ? "#f8fafc"
                            : "#fff",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#f1f5f9")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          currentConversation?.id === conversation.id
                            ? "#f8fafc"
                            : "#fff")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
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
                          {conversation.otherUser?.avatar_url ? (
                            <img
                              src={conversation.otherUser.avatar_url}
                              alt="avatar"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          ) : (
                            conversation.otherUser?.username?.[0]?.toUpperCase() ||
                            "U"
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600", color: "#374151" }}>
                            {conversation.otherUser?.username || "Kullanıcı"}
                          </div>
                          {conversation.lastMessage && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#6b7280",
                                marginTop: "2px",
                              }}
                            >
                              {conversation.lastMessage.content.length > 30
                                ? conversation.lastMessage.content.substring(
                                    0,
                                    30
                                  ) + "..."
                                : conversation.lastMessage.content}
                            </div>
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div
                            style={{
                              background: "#7c3aed",
                              color: "#fff",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {conversations.length > 0 && (
                  <div
                    style={{
                      padding: "16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={() => setShowUserList(true)}
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        width: "100%",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      💬 Yeni Sohbet Başlat
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                {currentConversation ? (
                  <>
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
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
                        {currentConversation.otherUser?.avatar_url ? (
                          <img
                            src={currentConversation.otherUser.avatar_url}
                            alt="avatar"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          currentConversation.otherUser?.username?.[0]?.toUpperCase() ||
                          "U"
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", color: "#374151" }}>
                          {currentConversation.otherUser?.username ||
                            "Kullanıcı"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {messages.map((message, index) => (
                        <div
                          key={`${message.id}-${index}`}
                          style={{
                            alignSelf:
                              message.sender_id === user.id
                                ? "flex-end"
                                : "flex-start",
                            maxWidth: "70%",
                          }}
                        >
                          <div
                            style={{
                              background:
                                message.sender_id === user.id
                                  ? "#7c3aed"
                                  : "#f3f4f6",
                              color:
                                message.sender_id === user.id
                                  ? "#fff"
                                  : "#374151",
                              padding: "8px 12px",
                              borderRadius: "12px",
                              fontSize: "14px",
                              wordBreak: "break-word",
                            }}
                          >
                            {message.content}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "4px",
                              textAlign:
                                message.sender_id === user.id
                                  ? "right"
                                  : "left",
                            }}
                          >
                            {formatTime(message.created_at)}
                            {message.sender_id === user.id && (
                              <span style={{ marginLeft: "4px" }}>
                                {message.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderTop: "1px solid #e5e7eb",
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Mesajınızı yazın..."
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={loading || !newMessage.trim()}
                        style={{
                          background: "#7c3aed",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor:
                            loading || !newMessage.trim()
                              ? "not-allowed"
                              : "pointer",
                          opacity: loading || !newMessage.trim() ? 0.6 : 1,
                        }}
                      >
                        {loading ? "Gönderiliyor..." : "Gönder"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280",
                    }}
                  >
                    Sohbet seçin
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
