# 🎮 Playzone

Tarayıcı tabanlı oyun sitesi. Full-Stack JavaScript ile yazılmıştır.

## Teknolojiler

| Katman      | Teknoloji             |
|-------------|----------------------|
| Frontend    | React + JSX           |
| Backend     | Node.js + Express     |
| Veritabanı  | PostgreSQL             |
| Stil        | CSS + Inline styles   |
| Auth        | JWT (jsonwebtoken)    |

## Kurulum

### 1. PostgreSQL Kur ve Veritabanı Oluştur

```bash
# PostgreSQL'i başlat
psql -U postgres

# Veritabanı oluştur
CREATE DATABASE playzone;
\q
```

### 2. Server Ayarları

```bash
cd server
cp .env.example .env
# .env dosyasını düzenle (DATABASE_URL, JWT_SECRET)
npm install
```

### 3. Client Ayarları

```bash
cd client
npm install
```

### 4. Çalıştır

```bash
# Kök dizinde (her ikisini birden başlatır)
npm install
npm run dev

# Ya da ayrı ayrı:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm start
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:5000

## Klasör Yapısı

```
playzone/
├── client/                  ← React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── GameCard.jsx
│       │   └── Leaderboard.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   └── useApi.js
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── GamePage.jsx   ← Oyun motoru burada
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── App.jsx
│       └── index.js
│
├── server/                  ← Node.js backend
│   ├── db/
│   │   └── index.js         ← PostgreSQL bağlantısı + tablo oluşturma
│   ├── middleware/
│   │   └── auth.js          ← JWT doğrulama
│   ├── routes/
│   │   ├── auth.js          ← /api/auth
│   │   ├── games.js         ← /api/games
│   │   └── scores.js        ← /api/scores
│   ├── .env.example
│   ├── index.js             ← Express sunucusu
│   └── package.json
│
├── package.json             ← Kök (concurrently ile iki sunucu birden)
└── README.md
```

## API Endpointleri

| Method | Endpoint                         | Açıklama              | Auth |
|--------|----------------------------------|-----------------------|------|
| POST   | /api/auth/register               | Kayıt ol              | —    |
| POST   | /api/auth/login                  | Giriş yap             | —    |
| GET    | /api/auth/me                     | Mevcut kullanıcı      | ✓    |
| GET    | /api/games                       | Tüm oyunlar           | —    |
| GET    | /api/games/:slug                 | Oyun detayı           | —    |
| POST   | /api/scores                      | Skor kaydet           | ✓    |
| GET    | /api/scores/leaderboard/:game_id | Liderlik tablosu      | —    |
| GET    | /api/scores/my/:game_id          | Kendi skorlarım       | ✓    |

## Oyun: Hellblast

ULTRAKILL tarzı top-down FPS. Özellikler:
- 3 farklı silah (Pistol, Shotgun, Railgun)
- Dash sistemi (3 şarj, yenilenir)
- Düşman dalgaları (her 5. dalga = boss)
- Rank sistemi (D → C → B → A → S → SS → SSS)
- Style göstergesi
- Skor otomatik kaydedilir (giriş yapılmışsa)
- Leaderboard (gerçek zamanlı)
