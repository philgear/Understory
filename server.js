import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(compression());
const port = process.env.PORT || 4200;

// Use process.cwd() to ensure we are looking in the right place
const rootDir = process.cwd();
const distFolder = join(rootDir, 'dist');

console.log(`[SERVER] Starting...`);
console.log(`[SERVER] Current working directory: ${rootDir}`);
console.log(`[SERVER] Expected dist folder: ${distFolder}`);

let geminiApiKeyCached = '';

async function fetchGeminiApiKey() {
  // Layer 1: Process Environment
  if (process.env.GEMINI_API_KEY) {
    console.log('[Secrets] Using GEMINI_API_KEY from environment.');
    return process.env.GEMINI_API_KEY;
  }

  // Layer 2: Local Filesystem (.env or .env.local)
  for (const envFile of ['.env.local', '.env']) {
    try {
      const localEnv = fs.readFileSync(join(rootDir, envFile), 'utf8');
      const match = localEnv.match(/GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
      if (match) {
        console.log(`[Secrets] Manual load success: ${envFile}`);
        return match[1].trim();
      }
    } catch (e) { }
  }

  // Layer 3: Cloud Infrastructure (Secret Manager)
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    console.warn('[WARN] GOOGLE_CLOUD_PROJECT is not set. To fetch from GCP Secret Manager, define this variable. Returning empty string.');
    return '';
  }

  try {
    console.log(`[Secrets] Fetching GEMINI_API_KEY from GCP Secret Manager for project ${projectId}...`);
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      // We expect the secret name to be GEMINI_API_KEY
      name: `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`,
    });
    const payload = version.payload.data.toString('utf8');
    console.log('[Secrets] Successfully fetched GEMINI_API_KEY from GCP.');
    return payload;
  } catch (err) {
    console.warn(`[WARN] Failed to fetch secret GEMINI_API_KEY from GCP. Returning empty string. Error: ${err.message}`);
    return '';
  }
}

// Fetch secret on startup
fetchGeminiApiKey().then(key => {
  geminiApiKeyCached = key;
});

if (fs.existsSync(distFolder)) {
  const contents = fs.readdirSync(distFolder);
  console.log(`[SERVER] Contents of ${distFolder}:`, contents);
} else {
  console.error(`[SERVER] ERROR: ${distFolder} does not exist!`);
  console.log(`[SERVER] Contents of ${rootDir}:`, fs.readdirSync(rootDir));
}

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files via Express directly to avoid generic filesystem deadlocks
// index: false prevents static middleware from serving index.html on root `/` requests
app.use(express.static(distFolder, { maxAge: '1y', index: false }));

// Fallback to index.html for Angular routing and root requests
app.get(/(.*)/, (req, res) => {
  // Only intercept if we are serving index.html or fallback routing (no extension)
  const isDoc = req.url === '/' || req.url === '/index.html' || !req.url.includes('.');
  const indexPath = join(distFolder, 'index.html');

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (isDoc && fs.existsSync(indexPath)) {
    try {
      let html = fs.readFileSync(indexPath, 'utf8');
      if (geminiApiKeyCached) {
        // Inject script immediately before closing </head>
        const scriptTag = `<script>window.GEMINI_API_KEY = "${geminiApiKeyCached}";</script>\n</head>`;
        html = html.replace('</head>', scriptTag);
      }
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (err) {
      console.error('[SERVER] Error injecting secret into index.html:', err);
    }
  }

  res.sendFile(indexPath);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[SERVER] Listening on port ${port}`);
});
