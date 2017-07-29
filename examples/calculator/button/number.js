const http = require('http');
const { success, notFound } = require('../lib/responses');

const numberButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(\d)$/);

  if (!match) {
    return notFound(response);
  }

  const number = match[1];

  success(response, {
    content: `
      <button>${number}</button>
    `
  });
});

numberButton.listen(process.env.PORT);
