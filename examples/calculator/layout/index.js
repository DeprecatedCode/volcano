const http = require('http');
const { success, notFound } = require('../lib/responses');

const layout = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  success(response, {
    content: `
      @lava(/display)
      @lava(/keypad)
    `
  });
});

layout.listen(process.env.PORT);
