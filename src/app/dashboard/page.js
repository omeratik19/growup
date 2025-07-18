"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProjects();
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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    let image_url = null;
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // DİKKAT: Dosya yolunun başında / yok!
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

  return (
    <div style={{ maxWidth: 540, margin: "40px auto" }}>
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
      </div>
    </div>
  );
}
