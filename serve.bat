@echo off
echo Starting blog server at http://localhost:4000
echo Press Ctrl+C to stop
node -e "require('http').createServer((req, res) => { require('fs').readFile(__dirname + '/build' + (req.url === '/' ? '/index.html' : req.url), (err, data) => { if (err) { res.writeHead(404); res.end('Not Found'); } else { res.writeHead(200); res.end(data); } }); }).listen(4000, () => console.log('Server running at http://localhost:4000'))"
