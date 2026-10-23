# 🍽️ Chatori Gali | Seat Reservation & Smart Menu Booking System

A premium full-stack MERN (MongoDB, Express.js, React.js, Node.js) application that allows customers to reserve seats/tables, check peak busy hours, pre-order menu items with a 60% advance deposit, and helps restaurant/kitchen staff manage food preparation timelines efficiently.

---

## 🚀 Features

### 🤖 AI Agentic Concierge & RAG System
1. **LangGraph Multi-Step Dining Concierge**:
   - Conversational state machine (`StateGraph`) orchestrating intent routing, tool calling, and grounded response synthesis.
   - Real-time token-by-token streaming via **Server-Sent Events (SSE)** with typewriter UI rendering.
   - Displays live agent telemetry pills showing step-by-step reasoning (`🧠 Classifying intent...`, `🔧 Executing MCP tool...`).
2. **Semantic Menu RAG Pipeline & Vector Store**:
   - Ingests culinary catalog, macro profiles, calorie counts, spice levels, and allergens into vector space.
   - Dense cosine vector search for natural language queries (*"Suggest high-protein dinner under $30 with no nuts"*).
3. **Model Context Protocol (MCP) Tool Integration**:
   - Standardized tool schemas conforming to the MCP spec: `search_menu_rag`, `check_table_slots`, `calculate_deposit`, `get_restaurant_info`.
   - Exposes MCP discovery and invocation endpoints (`GET /api/ai/mcp/tools` & `POST /api/ai/mcp/call`).
4. **Interactive Actionable Chat Chips**:
   - Inline recommendation cards with instant "Pre-order Dish" and "Reserve Table" buttons linked into the booking flow.

### 👤 Customer Facing
1. **Seat Reservation & Live Busy Hours**:
   - Date selection dynamically queries backend database to display hourly reservation counts.
   - Beautiful **CSS occupancy chart** helps customers choose less crowded slots.
   - Interactive table layout where booked slots dynamically grey out taken tables.
2. **Pre-Order Menu**:
   - Browse high-definition, categorized dish list (Appetizers, Mains, Desserts, Beverages) with descriptions and pricing.
   - Real-time cart calculations displaying total meal price and the required **60% advance deposit**.
3. **Simulated Payment Checkout**:
   - Premium checkout layout to securely enter credit card details.
   - Handles simulated transaction states (loading, success, receipt validation).
4. **Customer Dashboard**:
   - Lists reservation timeline, group sizes, and table assignments.
   - Displays real-time **Kitchen Prep Status** (`Queued`, `Cooking`, `Ready`).
   - Detailed billing receipts with deposits paid and balances due at table.

### 🍳 Restaurant Staff & Kitchen
1. **Kitchen Prep Kanban Board**:
   - Displays incoming pre-orders grouped by guests' arrival times.
   - Dynamic columns: `Not Started` ➔ `In Preparation` ➔ `Ready`.
   - Real-time urgency warning banners for tables arriving within 1 hour.
2. **Management Analytics Panel**:
   - Real-time counters showing total bookings, collected deposits, and active orders.
   - Interactive calendar listing all guest names, contact details, table numbers, and prep status.
   - Horizontal peak hours reports to optimize staffing levels and table rotations.

---

## 🛠️ Tech Stack
### AI & Agentic Infrastructure
- **LangChain / LangGraph**: Multi-step agentic orchestration, conversational memory, and conditional tool-calling state graphs
- **RAG Pipelines & In-Memory Vector Store**: Vector embeddings, culinary document indexing, and dense cosine similarity retrieval
- **Model Context Protocol (MCP)**: Standardized protocol exposing restaurant backend tools (seat booking, allergen lookups, billing) to LLM agents
- **Real-Time Streaming**: Server-Sent Events (**SSE**) for low-latency token-by-token LLM conversational streaming

### Backend & Databases
- **Node.js** & **Express.js** (configured in ESM asynchronous pattern)
- **MongoDB & Mongoose**: Schema design & aggregation pipelines for analytics and dynamic culinary catalogs
- **Razorpay Payment Gateway**: Cryptographic HMAC-SHA256 signature verification and simulated sandbox fallback for advance deposit collection
- **JSON Web Tokens (JWT)** & **Bcryptjs** (secure credentials hashing & role-based access control)

### Frontend
- **React.js** (scaffolded with Vite) & **Next.js** compatibility
- **Vanilla CSS** (custom variables, HSL Obsidian-Gold colors, glassmorphism, slide-up/scale-in animations)
- **Axios** (pre-configured client with interceptors for automatic JWT authorization headers injection)
- **React Router DOM** (routes definitions & role-based route guard shields)
- **Lucide React** (pixel-perfect premium iconography)

---

## 📁 Project Structure

```
test/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/      # auth, menu, reservation controllers
│   │   ├── middleware/       # JWT auth & role guards
│   │   ├── models/           # User, MenuItem, Reservation schemas
│   │   ├── routes/           # routing endpoints
│   │   ├── scripts/          # validate-endpoints, test-frontend scripts
│   │   └── seed.js           # database seeder script
│   ├── .env
│   ├── index.js              # server bootstrapper
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       # NavBar
    │   ├── context/          # AuthContext
    │   ├── pages/            # Home, Login, Register, ReservationFlow, dashboards
    │   ├── styles/           # global.css design tokens
    │   ├── utils/            # api axios pre-config
    │   └── App.jsx           # react router config
    ├── index.html
    └── package.json
```

---

## 📦 Sharing & Packaging

If you want to zip this folder and share it with someone else, make sure to **exclude the `node_modules` folders** from both the `backend/` and `frontend/` directories. Excluding them reduces the file size drastically and ensures the recipient gets a clean, platform-compatible installation of the dependencies.

To prepare the project for sharing:
1. Delete (or exclude from the zip) `backend/node_modules/` and `frontend/node_modules/`.
2. Keep the `backend/.env.example` file so the recipient knows which environment variables to configure.
3. Zip the project root folder.

When the recipient receives the zip file, they must extract it and follow the **Installation & Running Locally** steps below.

---

## ⚙️ Installation & Running Locally


### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running on local port `27017` or Atlas URI)

### Setup Steps

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:

3. **Seed Mock Database**:
   Populates users, sample menu cards, and mock reservation history to visualize data immediately:
   ```bash
   npm run seed
   ```

4. **Start Backend API Server**:
   ```bash
   npm run dev
   ```

5. **Install Frontend Dependencies**:
   Open a separate terminal window:
   ```bash
   cd frontend
   npm install
   ```

6. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 🔑 Test Credentials

Use these pre-seeded accounts to experience all role dashboards:

| Role | Email | Password | Access Dashboard |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@hotel.com` | `customer123` | Seating booking flow, pre-orders, My Bookings status |
| **Kitchen Staff** | `staff@hotel.com` | `staff123` | Kitchen board kanban view, toggle preparation status |
| **Admin Manager** | `admin@hotel.com` | `admin123` | Overall sales statistics, peak reservation hours charts, calendar list |

---

## 🧪 Automated Testing

1. **AI Pipeline Validation Suite** (Tests MCP tool specifications, Vector Store RAG ingestion, and LangGraph Agent execution):
```bash
cd backend
node src/scripts/validate-ai-endpoints.js
```

2. **Core Reservation & Endpoints Validation Suite**:
```bash
cd backend
node src/scripts/validate-endpoints.js
```
