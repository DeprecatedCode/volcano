const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');

const sqrtButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  success(response, {
    content: `
      <button lava-click>√</button>
    `
  });
});

sqrtButton.listen(process.env.PORT, ready);
