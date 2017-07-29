const http = require('http');

const display = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/html'
  });

  response.end(`0`);
});

display.listen(process.env.PORT);
