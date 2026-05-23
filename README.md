# AUDTRILHA

AUDTRILHA is a next-generation digital publishing platform for novels, mangas, and interactive stories. It combines a high-performance reader experience with a powerful creator suite.

## 🚀 Key Features

- **Reader Mode**: High-performance reading interface, genre discovery, and personal library.
- **Social Engagement**: Likes, follows, and unified commenting system.
- **Community**: Dedicated space for discussions (Creator-only posts for quality control).
- **Creator Studio**: Advanced writing tools, world-building management, and direct-to-reader publishing.
- **Digital Economy**: Currency system (Coins), premium chapter unlocks, and author payout infrastructure.
- **Google Drive Integration**: Real-time sync for manuscripts and backups.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Motion.
- **Backend**: Express.js (Node.js) with tsx.
- **Database & Auth**: Firebase Firestore & Firebase Auth.
- **State Management**: Zustand.
- **Styling**: Tailwind Typography + custom cyberpunk aesthetic.

## 🏗 Architecture

The project follows a **Hybrid Draft/Live** architecture:
- **Private Data**: Stored in `projects` collection (Firestore) and Google Drive.
- **Public Data**: Stored in `published_works` and `published_chapters` for reader consumption.
- **Financial Security**: All sensitive transactions are handled via server-side API routes using Firebase Admin SDK.

## 📁 Project Structure

- `src/features/`: Modularized features (Auth, Discover, Community, Forge, etc.)
- `src/components/`: Reusable UI components and Layout.
- `src/store/`: Global state management with Zustand.
- `server.ts`: Express backend serving API routes and Vite middleware.
- `firestore.rules`: Security rules enforcing role-based access control.

## ⚙️ Setup

1. Install dependencies: `npm install`
2. Configure environment variables in `.env` (based on `.env.example`).
3. Set up Firebase project and download credentials if running locally.
4. Start development server: `npm run dev`

## 📜 Documentation

- `docs/LOGIN_LOGICA.md`: Detailed login and role logic.
- `AGENTS.md`: Technical guidelines and architecture rules.
