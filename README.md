# SmartHarvest

**SmartHarvest** is a modern, full-stack crop management app designed for small-scale indoor or home growers. Built with React, Vite, Tailwind CSS, Express, and PostgreSQL (via Neon and Drizzle ORM), it helps you track crops, log events, and monitor your growing environment with ease.

## Features

- 📋 **Crop Dashboard:** View all active crops, ready-to-harvest, and those needing attention at a glance.
- 🪴 **Crop Details:** See detailed information, growth progress, and event history for each crop.
- 📝 **Event Logging:** Log watering, fertilizing, pruning, treatments, and more with date and time.
- 🔒 **Simple Auth:** Shared password login for easy family or team access.
- 📊 **Statistics:** Track monthly harvests and crop activity.
- 🌱 **Responsive UI:** Clean, mobile-friendly interface using Tailwind CSS.
- ⚡ **Fast Dev Experience:** Powered by Vite for instant reloads and modern tooling.
- 🗄️ **PostgreSQL Database:** Serverless Neon backend with Drizzle ORM migrations.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Wouter
- **Backend:** Express, Drizzle ORM, Neon (PostgreSQL)
- **Auth:** Simple session-based with shared password
- **Other:** TypeScript, Zod, Radix UI, React Query

## Getting Started

1. Clone the repo
2. Set up a Neon database and add your `DATABASE_URL` to a `.env` file
3. Run migrations: `npm run db:push`
4. Start the app: `npm run dev`
5. Log in with the default password (`smartharvest2025`) or set your own via `SHARED_PASSWORD` in `.env`

---

**SmartHarvest** is perfect for hobbyists, families, or anyone who wants a simple, beautiful way to track their indoor crops!
