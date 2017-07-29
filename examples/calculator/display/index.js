const http = require('http');
const { success, notFound } = require('../lib/responses');

const display = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  success(response, {
    content: `0`
  });
});

display.listen(process.env.PORT);
