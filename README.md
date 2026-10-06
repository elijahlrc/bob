# Auto

An in-browser autobattler. TypeScript + [Phaser 4](https://phaser.io), built with [Vite](https://vite.dev).

## Setup

Requires Node.js 24+.

```bash
npm install
```

## Commands

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Dev server at http://localhost:5173 with hot reload |
| `npm run build`      | Type-check, then build a static site into `dist/`   |
| `npm run preview`    | Serve the built `dist/` locally                     |
| `npm test`           | Run unit tests once (Vitest; `*.test.ts` files)     |
| `npm run test:watch` | Re-run tests on change                              |
| `npm run lint`       | ESLint                                              |
| `npm run format`     | Prettier: rewrite files in place                    |
| `npm run check`      | Type-check + lint + format check + tests            |

## Layout

- `index.html` — page shell; loads `src/main.ts`
- `src/` — game source
- `public/` — static assets copied as-is into the build (create when needed)

`dist/` is a plain static site (relative paths), so it can be hosted anywhere, including GitHub Pages.
