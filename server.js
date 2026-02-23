import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Use process.cwd() to ensure we are looking in the right place
const rootDir = process.cwd();
const distFolder = join(rootDir, 'dist');

console.log(`[SERVER] Starting...`);
console.log(`[SERVER] Current working directory: ${rootDir}`);
console.log(`[SERVER] __dirname: ${__dirname}`);
console.log(`[SERVER] Expected dist folder: ${distFolder}`);

if (fs.existsSync(distFolder)) {
  const contents = fs.readdirSync(distFolder);
  console.log(`[SERVER] Contents of ${distFolder}:`, contents);
} else {
  console.error(`[SERVER] ERROR: ${distFolder} does not exist!`);
  // List root directory to see where we are
  console.log(`[SERVER] Contents of ${rootDir}:`, fs.readdirSync(rootDir));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files
app.use(express.static(distFolder));

// Fallback to index.html
app.use((req, res) => {
  console.log(`[SERVER] Request: ${req.url}`);
  const indexPath = join(distFolder, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`[SERVER] ERROR: index.html not found at ${indexPath}`);
    res.status(404).send('Not Found');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[SERVER] Listening on port ${port}`);
});
