const http = require('http');

const numberButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(\d)$/);

  if (!match) {
    response.writeHead(404);
    response.end();
    return;
  }

  const number = match[1];

  response.writeHead(200, {
    'Content-Type': 'text/html'
  });

  response.end(`
    <button>${number}</button>
  `);
});

numberButton.listen(process.env.PORT);
