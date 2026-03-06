const express = require('express');
const app = express();

app.use((req, res, next) => {
  const host = req.hostname || '';
  console.log('Hostname:', host);
  if (host.includes('understory')) {
    return res.redirect(301, `https://pocketgull.app${req.originalUrl}`);
  }
  res.send('OK');
});

const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`Server running on port ${port}`);
    require('child_process').exec(`curl -s -v -H "Host: understory.app" http://localhost:${port}`, (err, stdout, stderr) => {
        console.log(stderr);
        process.exit(0);
    });
});
