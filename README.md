
# Scheduling of Care Project Frontend Demo (Mock Mode)

> Quick guide for **local frontend demo** using mock data & mock login. Includes three demo accounts, `.env.local` setup, where to put the mock API, and common gotchas.

---

## 👤 Demo Accounts (Mock Login)

On the login page `/`, use any set below. After login, role is stored in browser storage and controls routing & permissions.

| Role       | Email                  | Password     |
| ---------- | ---------------------- | ------------ |
| Family     | `family@email.com`     | `family`     |
| Carer      | `carer@email.com`      | `carer`      |
| Management | `management@email.com` | `management` |

\* Redirects are based on the current mock logic. If you change your routes, also update the logic in the login page.

---

## ⚙️ Enable Mock Mode

Create **`.env.local`** in the project root:

```ini
NEXT_PUBLIC_ENABLE_MOCK=1
```

What this does:

- Sets the app to **frontend-only mock** mode: login & data are handled on the client, no backend required.
- Tasks are stored in `localStorage["tasks"]`; a demo seed is written on first run.
- Viewer role is stored in:
  - `sessionStorage["mockRole"]` (per-tab, preferred in mock)
  - `localStorage["activeRole"]` (persistent fallback)

---

## ▶️ Run Locally

```bash
# install dependencies
npm install

# start dev server
npm run dev

# open
http://localhost:3000
```

---

## 🧰 Where Is the Mock API?

```
Source files in /src/lib/mock/mockApi.ts which include more details
```

pages import from `@/lib/mock/mockApi`.

---
