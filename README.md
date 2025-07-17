# Lagerbestand Überwachung System

Ein modernes Web-System zur Überwachung von Lagerbeständen mit Code-basiertem Login.

## 🚀 Features

- **Code-Login System** - Anmeldung mit Zugangscodes im Format `XXXX-XXXXX-XXXXX-XXXX`
- **Wartungsarbeiten-Design** - Professionelle Wartungsseite mit animiertem Loader
- **Produktübersicht** - Vollständige Lagerbestand-Verwaltung
- **Bestellsystem** - Bestellungen und Warteliste für Produkte
- **Responsive Design** - Optimiert für alle Geräte

## 🛠️ Technologie-Stack

- **Frontend:** Astro.js mit TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Code-basiertes Login-System
- **Server:** Node.js Adapter

## 📦 Installation

1. **Repository klonen:**
```bash
git clone <repository-url>
cd vape-seite-user
```

2. **Dependencies installieren:**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren:**
```bash
cp env.example .env
```
Fügen Sie Ihre Supabase-Credentials hinzu:
```env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🚀 Entwicklung

**Development Server starten:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
```

**Preview Server:**
```bash
npm run preview
```

## 📁 Projektstruktur

```
src/
├── pages/           # Astro-Seiten
│   ├── index.astro  # Hauptseite (Wartungsarbeiten + Login)
│   └── user/        # User-Bereich
│       └── dashboard.astro
├── layouts/         # Layout-Komponenten
├── lib/            # Utilities (Supabase-Client)
└── styles/         # CSS-Styles
```

## 🔐 Code-Login System

### Code-Format:
```
XXXX-XXXXX-XXXXX-XXXX
```
- **4 Zeichen** - **5 Zeichen** - **5 Zeichen** - **4 Zeichen**
- Nur Großbuchstaben (A-Z) und Zahlen (0-9)
- Beispiel: `ABCD-12345-67890-EFGH`

### Funktionalität:
- Automatische Formatierung während der Eingabe
- Validierung des Code-Formats
- Session-Management für angemeldete Benutzer
- Direkte Weiterleitung zum Dashboard

## 🎨 Design

- **Wartungsarbeiten-Theme** - Professionelles "Under Construction" Design
- **Animierter Loader** - Roboter-Animation während Wartungsarbeiten
- **Minimalistisches Design** - Sauber und benutzerfreundlich
- **Responsive Layout** - Optimiert für Desktop und Mobile

## 📊 Datenbank

Das System verwendet Supabase mit folgenden Haupttabellen:
- `access_codes` - Zugangscodes für Login
- `products` - Produktdaten und Lagerbestand
- `user_accounts` - Benutzerkonten (optional)

## 🔧 Konfiguration

### Astro-Konfiguration:
- **Output:** Server (SSR)
- **Adapter:** @astrojs/node (Standalone-Modus)
- **Styling:** Tailwind CSS

### Supabase-Setup:
1. Supabase-Projekt erstellen
2. Tabellen nach Bedarf anlegen
3. Zugangscodes in `access_codes` Tabelle einfügen
4. RLS-Policies konfigurieren

## 📝 Lizenz

© 2024 Lagerbestand Überwachung System
