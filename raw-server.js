import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distFolder = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
    let filePath = path.join(distFolder, req.url === '/' ? 'index.html' : req.url);
    
    // Simple fallback logic since it's an SPA
    if (!fs.existsSync(filePath)) {
        filePath = path.join(distFolder, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end("Error loading file.");
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

server.listen(4201, () => {
    console.log("Raw Node Server listening on port 4201");
});
