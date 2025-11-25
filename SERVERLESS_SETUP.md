# Serverless Backend Setup for Vercel

## Overview

Your backend has been converted to run as serverless functions on Vercel. The contact form is handled by a serverless function while resume handling is done on the client side.

## File Structure

```
server/
├── api/
│   └── contact.ts          # Serverless function handler for contact form
├── shared/
│   └── schema.ts           # Shared validation schemas
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies and build scripts
└── tsconfig.json           # TypeScript configuration
```

## How It Works

### Contact Form Handler (`api/contact.ts`)

- **Endpoint**: `POST /api/contact`
- **Handler Type**: Vercel Serverless Function (uses `VercelRequest` and `VercelResponse`)
- **Features**:
  - CORS handling with configurable allowed origins
  - Request validation using Zod schema
  - Email sending via Nodemailer
  - Error handling and logging
  - Preflight request handling (OPTIONS method)

### Request/Response Format

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Message sent successfully!"
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Environment Variables Required

Add these to your Vercel project settings:

- `SMTP_HOST` - Your SMTP server hostname
- `SMTP_PORT` - SMTP port (default: 587, use 465 for secure)
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password
- `SMTP_SECURE` - Set to "true" for port 465, "false" for port 587
- `CONTACT_EMAIL` - Email address where contact form submissions are sent
- `MAIL_FROM` - (Optional) Email address to use as sender
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., "https://example.com,https://www.example.com")
- `NODE_ENV` - Should be "production" on Vercel

## Deployment Steps

1. **Push your code to Git** (GitHub, GitLab, or Bitbucket)

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select the project root or `/server` folder as the root directory

3. **Set Environment Variables**:

   - In Vercel dashboard: Settings → Environment Variables
   - Add all the SMTP and configuration variables above
   - Ensure variables are available for Production deployment

4. **Deploy**:
   - Vercel will automatically build and deploy when you push to main branch
   - Your serverless functions will be deployed to Vercel's edge network

## How Vercel Builds Your Functions

1. **Build Phase**:

   - Vercel reads `vercel.json` configuration
   - Finds all `.ts` files in the `api/` directory
   - Compiles them using `@vercel/node`
   - Creates optimized serverless function bundles

2. **Routing**:

   - `/api/contact` routes to `api/contact.ts` handler
   - Each function is deployed as an independent serverless function

3. **Execution**:
   - When a request comes in, Vercel routes it to the correct function
   - Function executes, processes request, sends response
   - Function is scaled up/down based on demand automatically

## Testing Locally

```bash
# For local testing with Vercel CLI
npm install -g vercel

# Run local Vercel environment
vercel dev

# Test contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@example.com", "message": "Test message"}'
```

## CORS Configuration

The contact handler automatically manages CORS:

- Allows requests from origins specified in `ALLOWED_ORIGINS` env variable
- Supports preflight OPTIONS requests
- Credentials are supported
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: X-Requested-With, Content-Type, Accept, Authorization

## Client-Side Integration

Make requests to your serverless API:

```javascript
const response = await fetch(
  "https://your-vercel-domain.vercel.app/api/contact",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name: "John Doe",
      email: "john@example.com",
      message: "Your message here",
    }),
  }
);

const data = await response.json();
console.log(data);
```

## Notes

- The original Express server files (`index.ts`, `routes.ts`, `vite.ts`, etc.) are kept for local development but not deployed to Vercel
- Vercel automatically handles scaling and CDN distribution
- Functions have a 12-second execution timeout on Pro plan (5 seconds on free)
- Cold starts are managed by Vercel's infrastructure
- No need to manage servers - fully serverless architecture

## Troubleshooting

**Functions not deploying**:

- Check `vercel.json` format
- Ensure all imports are resolvable
- Verify TypeScript compilation with `npm run check`

**CORS errors**:

- Add your frontend domain to `ALLOWED_ORIGINS` environment variable
- Ensure the domain includes protocol (https://)

**Email not sending**:

- Verify SMTP credentials in Vercel environment variables
- Check SMTP host accessibility from Vercel servers
- Review function logs in Vercel dashboard
