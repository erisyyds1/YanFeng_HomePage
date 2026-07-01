# Cloudflare Backend Plan

This document is the production backend plan for the Yanfeng club portal.

## Current State

The project is currently a Vite React frontend with a local demo API:

- Frontend: Vite, React, static assets in `public/`.
- Local API: `server.mjs`.
- Production API skeleton: `functions/api/[[path]].js`.
- Local data: `db.json`.
- API client base: `services/config.ts`.
- Local development: `npm run api` starts `http://localhost:3001`; Vite proxies `/api` to that port.

The current API already maps well to production:

| Feature | Local endpoint | Production endpoint |
| --- | --- | --- |
| Site settings | `GET/PATCH /site-settings` | `GET/PATCH /api/site-settings` |
| Videos | `GET/POST/PATCH/DELETE /videos` | `GET/POST/PATCH/DELETE /api/videos` |
| Gallery and album images | `GET/POST/PATCH/DELETE /media-images` | `GET/POST/PATCH/DELETE /api/media-images` |
| File upload | `POST /uploads` | `POST /api/uploads` |
| Articles | `GET /articles` | `GET /api/articles` |
| AI chat proxy | `POST /chat-messages` | `POST /api/chat-messages` |

`server.mjs` already accepts `/api/...` paths by stripping the prefix, so local and production routes can stay consistent.

## Recommended Cloudflare Architecture

Use Cloudflare as one deployment surface:

- Frontend: Cloudflare Pages.
- API: Pages Functions, or a Worker mounted under `/api/*`.
- Structured data: Cloudflare D1.
- Uploaded files: Cloudflare R2.
- Secrets: Cloudflare environment variables / secrets.
- Scheduled article sync: Worker Cron or an external script calling admin endpoints.

This keeps the site mostly static while allowing admin edits and uploads without running a dedicated server.

## Deployment Shape

Cloudflare Pages settings:

- Build command: `npm run build`
- Output directory: `dist`
- Production API base: default same-origin `/api`
- Local API override: optional `VITE_API_URL=http://localhost:3001`

The existing `services/config.ts` now defaults to `/api`, which is the production-friendly path.

## Data Ownership

### D1

Use D1 for content metadata:

- QQ group number.
- Video metadata.
- Gallery and album image metadata.
- Article metadata.
- Optional upload metadata.

### R2

Use R2 for uploaded files:

- Gallery images.
- Album images.
- Article cover images if the crawler stores local copies.

Recommended object keys:

```text
uploads/gallery/{yyyy}/{uuid}.{ext}
uploads/album/{yyyy}/{uuid}.{ext}
uploads/articles/{yyyy}/{uuid}.{ext}
```

The D1 record should store both the R2 key and the public URL.

### Static Public Assets

Keep core site design assets in `public/image`:

- Logo and favicon assets.
- Page backgrounds.
- Fixed character art.
- Built-in group photos.

These should remain Git-controlled because they are part of the site design.

## D1 Schema

The first schema draft lives in `docs/cloudflare-d1-schema.sql`.

Tables:

- `site_settings`
- `videos`
- `media_images`
- `articles`
- `uploads`

Use string IDs so migration from the current `Date.now()` IDs remains simple. Later, newly created records can use UUIDs.

## API Design

Public read endpoints:

```text
GET /api/site-settings
GET /api/videos
GET /api/media-images
GET /api/articles
POST /api/chat-messages
```

Admin endpoints:

```text
POST /api/admin/login
POST /api/uploads
PATCH /api/site-settings
POST /api/videos
PATCH /api/videos/:id
DELETE /api/videos/:id
POST /api/media-images
PATCH /api/media-images/:id
DELETE /api/media-images/:id
POST /api/articles
PATCH /api/articles/:id
DELETE /api/articles/:id
```

Article crawler endpoint, optional:

```text
POST /api/articles/sync
```

## Admin Auth

The current hidden sunflower password is only a UI gate. Production needs backend validation.

Recommended first version:

- The visible entry remains hidden: double-click the sunflower, submit the disguised message box, and enter edit mode only when the hidden phrase matches.
- `POST /api/admin/login` receives the disguised message value.
- Function compares it against a Cloudflare secret, for example `ADMIN_PASSWORD`.
- Function returns a short-lived signed token.
- Frontend stores the token in `sessionStorage`.
- Write endpoints require `Authorization: Bearer <token>`.

Secrets:

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
DIFY_API_KEY
DIFY_API_URL
```

Do not store these in frontend env variables.

## Upload Flow

For the current admin UI, use direct API upload first:

1. Admin selects image or enters URL.
2. `POST /api/uploads` receives `multipart/form-data`.
3. Function validates file type and size.
4. Function stores the file in R2.
5. Function returns `{ key, url }`.
6. Frontend saves the returned URL in `media_images`.

Suggested initial limits:

- Allowed types: `image/jpeg`, `image/png`, `image/webp`.
- Max file size: 8 MB after client-side compression.
- Prefer WebP for new uploads.
- Categories currently used by the UI: `gallery`, `album`, and `thumbnail`.

Later, if large uploads become frequent, switch to presigned direct-to-R2 uploads.

Local development stores uploaded files under `public/uploads`. That directory is ignored by Git except for `.gitkeep`. Production uploads should use R2 through the `MEDIA_BUCKET` binding.

## Frontend Changes Still Needed

The frontend already has service modules. The next frontend tasks are:

1. Add auth token support to write requests.
2. Add real file upload UI for gallery and album images.
3. Replace URL-only image form with "upload or URL".
4. Add article service when article management returns.
5. Remove localStorage fallback once production API is stable, or keep it only as an offline draft fallback.

## Migration Steps

1. Confirm current domain deployment target:
   - Cloudflare Pages, Worker, or an external server behind Cloudflare DNS.
2. Create Cloudflare Pages project for this repo.
3. Create D1 database.
4. Apply `docs/cloudflare-d1-schema.sql`.
5. Create R2 bucket.
6. Configure Pages Functions or Worker bindings:
   - `DB` for D1.
   - `MEDIA_BUCKET` for R2.
7. Use `wrangler.toml.example` as the binding reference, then configure matching bindings in Cloudflare Pages.
8. Configure secrets:
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `DIFY_API_KEY`
   - optional `DIFY_API_URL`
9. Deploy the existing Pages Function skeleton in `functions/api/[[path]].js`.
10. Deploy preview branch.
11. Test:
    - Read site settings.
    - Edit QQ group number.
    - Add/edit/delete video.
    - Upload gallery, album, and video thumbnail images.
    - Add/edit/delete gallery or album image.
12. Point the domain to the Cloudflare Pages production deployment.

## Local Development Strategy

Keep `server.mjs` for now. It is useful for UI iteration and for verifying API contracts.

Recommended local commands:

```bash
npm run api
npm run dev
```

The frontend now calls `/api` by default. Vite proxies `/api` to `http://localhost:3001`.

If direct API calls are needed:

```ini
VITE_API_URL=http://localhost:3001
```

## Notes From Cloudflare Docs

- Pages Functions are designed to add dynamic server-side behavior without running a dedicated server.
- D1 is Cloudflare's SQL database option for Workers and Pages.
- R2 is Cloudflare's object storage option for files and media.
- Cloudflare Pages Vite deployments use a build command and output directory, which matches this project's `npm run build` and `dist`.
