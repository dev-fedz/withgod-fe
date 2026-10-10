# WithGod Frontend (`withgod-fe`)

Next.js frontend for the WithGod Bible reader and devotion notebook.

## 🚀 Quickstart

### 1. Configure Environment
```bash
cp .env.local.example .env.local
```
Ensure:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Run Development Server
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3001](http://localhost:3001).

### 4. Build for Production
```bash
npm run build
```

### 5. Run with Docker
Build and run the standalone container:
```bash
docker build -t withgod-fe .
docker run -p 3001:3001 withgod-fe
```
Or run with standalone Docker Compose:
```bash
docker compose up -d --build
```

## 📐 Architecture
- `src/components/PersistentLayout.tsx`: Static sidebar/navbar shell with animated `framer-motion` page transitions.
- `src/components/PageLayout.tsx`: State synchronizer updating `AppContext`.
- `src/pages/bible.tsx`: Bible reader with highlight, note, comparison, insights, and devotion export.
- `src/pages/devotions.tsx`: Block editor with floating 📖 Bible picker and automatic image reflow.
- `src/pages/admin.tsx`: Management portal for Events and Verse of the Day.
