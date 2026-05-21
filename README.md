# 📖 Alif-Amin-Academy

An advanced, AI-accelerated platform built for the Quran Foundation Hackathon designed to revolutionize Quranic learning, interactive tutoring, and personalized student reflection.

## 🚀 Project Overview

* **Production Domain:** [alifamin.com](https://alifamin.com)
* **Infrastructure:** Hosted via Emergent Platform (Kubernetes Container environments) with Supervisor managing frontend and backend processes.
* **Core Architecture:** Decoupled modern single-page application architecture consisting of a high-performance asynchronous Python backend and a responsive, component-driven React frontend.

---

## 🔌 Hackathon API Integrations (Fully Compliant)

This project securely integrates multiple endpoints from the Quran Foundation ecosystem, strictly adhering to the newest developer guidelines for both Content and User-level access:

1. **Content APIs (OAuth2 Client Credentials Flow):** * Fetches full chapter metadata, Mushaf page-by-page rendering, and dynamic word-by-word Uthmani script for the interactive classroom viewer.

* **Strict Compliance:** All content requests are routed through the secure `apis.quran.foundation/content/api/v4/` gateway. The backend features a custom token manager that handles `client_credentials` authentication, caching the `x-auth-token` and automatically refreshing it prior to expiry.

2. **User APIs (OAuth2 + Bookmarks Proxy):** * **100% compliant User-Level Access.** Bypasses local database storage entirely. Implements the official **OAuth2 Authorization Code Flow with PKCE** (`/api/quran/v2/oauth/callback`) to securely link student accounts to Quran.com.

* Bookmarks are proxied directly to `apis.quran.foundation/v1/bookmarks` utilizing user-specific Access Tokens, featuring optimistic UI toggling and strict 401 error handling for unlinked accounts.

---

## ✨ Standout Platform Features

* **Ultra-Low Latency Virtual Classroom:** A custom "Zoom-style" interface powered by LiveKit, combining real-time video grids with an interactive Quran/Iqra board.
* **Synchronized Iqra Pointer:** Features highly optimized WebSocket data channels. We implemented a strict **60ms throttle** and hardware-accelerated CSS rendering (eliminating DOM thrashing) to ensure the tutor's pointer glides flawlessly on the student's screen, even on slow mobile connections.
* **Pagination State 'Self-Healing':** Complex frontend state management ensures that when a user jumps from deep inside a massive Surah (like Al-Baqarah) to a short Surah, the API parameters instantly reset, preventing empty queries to the Quran Foundation servers.
* **Automated Data Hygiene:** Advanced backend cascade deletion. Rejecting a tutor application automatically sweeps and purges associated data across 6 different MongoDB collections, preventing "zombie" accounts.
* **Optimistic UI Workflows:** From instant emerald-green bookmark toggles to late-submission Tutor Evaluation reports, the UI reacts instantly to user input without waiting for network refreshes.

---

## 🛠️ Technical Architecture & Tech Stack

### 🔹 Backend Ecosystem (Python / FastAPI)

An asynchronous, high-throughput API architecture utilizing ASGI standards and strict data validation schemas.

| Category | Technology | Purpose / Integration |
| --- | --- | --- |
| **Framework** | FastAPI (v0.110.1) | High-performance, asynchronous REST API routing |
| **Database** | MongoDB Atlas / Motor | Fully asynchronous NoSQL data layer |
| **Authentication** | Google OAuth 2.0 + **Quran Foundation OAuth2 (PKCE)** | Secure user sign-in, session state, and external API token exchange |
| **Real-time Media** | LiveKit Server SDK | Server-side management for audio/video classroom synchronization |
| **Cloud Storage** | Google Cloud Storage | Distributed object storage utilizing specialized buckets |
| **Payments** | Billplz Integration | Custom transactional handling implemented via `httpx` |

### 🔹 Frontend Ecosystem (React 19)

A modern, component-driven interface built on the latest React core primitives, optimized for smooth layouts and responsive states.

| Category | Technology | Description |
| --- | --- | --- |
| **Core Library** | React (v19.0.0) | Interactive user interface rendering |
| **Styling & UI** | Tailwind CSS + Shadcn/UI | Atomic utility styling combined with Radix UI |
| **State & Fetching** | TanStack React Query | Declarative caching, and asynchronous data fetching |
| **Real-time Video** | LiveKit Components React | Native wrapper interfaces for lower-latency virtual classrooms |
| **Quran Integration** | `react-quran` (v1.3.2) | Optimized components for localized Arabic rendering |
| **Forms & Validation** | React Hook Form + Zod | Performance-optimized form state tracking |

---

## 📂 Backend Module Breakdown

The server features a modular layout where logical separation ensures maintainability:

* `server.py` — Central application engine orchestration and background cron routines.
* `quran_routes.py` / `quran_v2_routes.py` — **Content API & OAuth Engine**. Features dual OAuth2 managers: one handling Client Credentials for fetching localized text feeds, and one managing the PKCE challenge state for users.
* `bookmark_routes.py` — **User API Proxy**. Acts as a secure middleman, taking frontend requests, attaching the user's `x-auth-token`, and mapping payload schemas (`{type: "ayah"}`) directly to the Quran Foundation servers.
* `classroom_routes.py` / `booking_routes.py` — Scheduling and execution loops for active virtual classes.
* `admin_routes.py` — High-level platform governance, including cascade-delete sanitization.
* `wallet_routes.py` / `payment_routes.py` — Complete programmatic ledger tracking user wallets and transactions.
* `models.py` — Centralized Pydantic models mapping domain contracts securely across the database.
