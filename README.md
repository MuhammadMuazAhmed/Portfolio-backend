# Server

This folder contains the standalone Express server for the portfolio.

Required env vars (for contact email):

- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS

Place resume.pdf at `server/public/resume.pdf` to enable the `/api/resume` endpoint.

Scripts:

- npm run dev (uses tsx)
- npm run build
- npm run start
