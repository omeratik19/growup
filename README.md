# 🚀 GrowUp - Proje Paylaşım Platformu

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi

- **Kayıt ve Giriş** - Güvenli kimlik doğrulama
- **Profil Yönetimi** - Avatar, bio, kullanıcı bilgileri
- **Takip Sistemi** - Kullanıcıları takip etme

### 📱 Proje Yönetimi

- **Proje Paylaşımı** - Görsel, başlık, açıklama ile proje ekleme
- **Kategori Sistemi** - Projeleri kategorilere ayırma
- **Proje Düzenleme** - Sadece proje sahibi düzenleyebilir
- **Proje Silme** - Güvenli silme işlemi

### ❤️ Etkileşim Sistemi

- **Beğeni Sistemi** - Projeleri beğenme/beğenmeyi kaldırma
- **Yorum Sistemi** - Projelere yorum yapma
- **Gerçek Zamanlı Güncellemeler** - Anında etkileşim

### 🔔 Bildirim Sistemi

- **Otomatik Bildirimler** - Beğeni, yorum, takip bildirimleri
- **Gerçek Zamanlı Bildirimler** - Anında bildirim güncellemeleri
- **Bildirim Yönetimi** - Okundu işaretleme, silme, filtreleme
- **Bildirim Sayacı** - Okunmamış bildirim sayısı

### 🔍 Arama ve Filtreleme

- **Gelişmiş Arama** - Kullanıcı ve proje arama
- **Kategori Filtreleme** - Kategoriye göre filtreleme
- **Tarih Filtreleme** - Zaman bazlı filtreleme
- **Beğeni Filtreleme** - Popülerlik bazlı filtreleme

### 🎨 Modern UI/UX

- **Responsive Tasarım** - Tüm cihazlarda uyumlu
- **Mor-Beyaz Tema** - Modern ve şık görünüm
- **Animasyonlar** - Smooth geçişler ve hover efektleri
- **Kullanıcı Dostu** - Kolay navigasyon

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React 18
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Inline CSS (Modern tasarım)
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel (Hazır)

## 📊 Veritabanı Şeması

### Ana Tablolar

- `users` - Kullanıcı bilgileri
- `profiles` - Kullanıcı profilleri
- `projects` - Projeler
- `categories` - Kategoriler
- `project_likes` - Beğeniler
- `project_comments` - Yorumlar
- `follows` - Takip sistemi
- `notifications` - Bildirimler

## 🚀 Kurulum

1. **Projeyi klonlayın**

```bash
git clone [repo-url]
cd growup
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Supabase kurulumu**

- Supabase projesi oluşturun
- Veritabanı şemalarını çalıştırın
- Environment variables'ları ayarlayın

4. **Geliştirme sunucusunu başlatın**

```bash
npm run dev
```

## 📝 Kullanım

1. **Kayıt/Giriş** - Ana sayfadan hesap oluşturun
2. **Proje Paylaşımı** - Dashboard'dan proje ekleyin
3. **Etkileşim** - Projeleri beğenin, yorum yapın
4. **Takip** - Kullanıcıları takip edin
5. **Bildirimler** - Bildirim zilinden takip edin

## 🔧 Geliştirme

### Dosya Yapısı

```
src/
├── app/                 # Next.js App Router
│   ├── dashboard/       # Ana dashboard
│   ├── profile/         # Profil sayfaları
│   ├── project/         # Proje detay sayfaları
│   ├── notifications/   # Bildirim sayfası
│   └── login/          # Giriş sayfası
├── components/          # React komponentleri
│   └── NotificationBell.js
└── lib/                # Yardımcı fonksiyonlar
    └── supabaseClient.js
```

### Önemli Özellikler

- **Güvenlik**: RLS (Row Level Security) ile veri koruması
- **Performance**: Optimized queries ve caching
- **Scalability**: Supabase ile ölçeklenebilir altyapı
- **Real-time**: WebSocket ile anlık güncellemeler

## 🎯 Gelecek Özellikler

- [ ] **Mesajlaşma Sistemi** - Kullanıcılar arası özel mesajlar
- [ ] **Grup Projeleri** - Çoklu kullanıcı projeleri
- [ ] **Analytics** - Proje istatistikleri
- [ ] **Mobil App** - React Native uygulaması
- [ ] **API** - Public API endpoints

## 📄 Lisans

MIT License - Özgürce kullanın ve geliştirin!

---

**GrowUp** ile projelerinizi paylaşın, toplulukla etkileşime geçin ve birlikte büyüyün! 🌱
