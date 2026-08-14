# Standing Rules for Influencer Marketing Platform — Web Client

Read these rules at the start of every task in this repository:

- **npm only**. Never pnpm or yarn. Commit `package-lock.json`, use `npm ci`.
- **No inline sx colours, radii, spacing or font sizes**. Every value comes from the theme. If a value is missing, **ADD IT TO THE THEME**.
- **Pages compose organisms only**. No raw MUI primitives in a page (`src/pages`).
- **src/contracts is generated**. Never edit it, never add to it, never redefine a type that already exists there.
- **No token in localStorage or sessionStorage**. The session is an httpOnly cookie handled by the browser.
- **Client-side role guards are UX only, never security**. The API enforces everything independently.
- **The brand experience has no influencer rate and no margin**. Never write a component that conditionally hides them; the API does not return them.
- **Run scripts/sync-contracts.sh** before any task that touches API types.
- **Never bind a raw URL to `href` or `src`**. Pass it through `safeUrl` / `safeImageUrl` from
  `@utils`. React escapes text, not URL attributes, so a stored `javascript:` value is executable.
- **Never display invented data.** No sample arrays, no hardcoded metric values, no placeholder
  figures dressed as real ones. If an endpoint does not exist, render an `EmptyState` that says so.
- **Routes stay lazy.** Pages are loaded with `React.lazy`; the current role's chunks are prefetched
  on idle in `src/routes/index.tsx`. Do not convert them to static imports to avoid a loading flash —
  that puts every role's screens in the initial bundle.
- **Heavy dependencies load behind a dynamic import.** `recharts` is only reachable through
  `molecules/LazyChartCard`; importing `ChartCard.tsx` directly would put ~100kB gz back into the
  entry chunk. Do not import barrels (`@molecules`, `@organisms`) from files in the entry path.
