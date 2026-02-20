# SDU Meow Web

A mobile-style React + TypeScript frontend implementation for SDU Meow, with user and admin routes, Ant Design + Tailwind UI, Axios API layer, Zustand auth state, and React Query server-state handling.

## Stack

- React 19 + TypeScript + Vite
- React Router
- Ant Design + TailwindCSS
- Axios
- Zustand
- React Query
- Vitest + Testing Library

## Run

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm lint
pnpm build
pnpm test:run
```

## Environment

Create `.env` when needed:

```bash
VITE_API_BASE_URL=https://m1.apifoxmock.com/m1/7761538-7507393-default
```

## Route coverage

Implemented routes include:

- Auth: `/login`
- User: `/user/home`, `/user/home-alt`, `/user/cats/:id`, `/user/cats/:id/profile`, `/user/publish`, `/user/new-cat`, `/user/sos/report`, `/user/leaderboard`, `/user/adopt/apply`, `/user/rewards`, `/user/kepu`, `/user/articles/:id`, `/user/me`, `/user/me-center`, `/user/me/edit`
- Admin: `/admin/home`, `/admin/cats`, `/admin/cats/:id/edit`, `/admin/adoptions`, `/admin/adoptions/:id`, `/admin/sos`, `/admin/sos/:id`, `/admin/announcements`, `/admin/announcements/:id/edit`, `/admin/articles`, `/admin/articles/:id/edit`, `/admin/users`, `/admin/users/:id`, `/admin/me`

## Mock limitations

Some endpoints in the provided cloud mock currently return 404. Those pages are still implemented with full UI shells and show unified error-state feedback.
