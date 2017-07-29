const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');

const numberButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(\d)$/);

  if (!match) {
    return notFound(response);
  }

  const number = match[1];

  success(response, {
    content: `
      <button lava-click="${number}">${number}</button>
    `
  });
});

numberButton.listen(process.env.PORT, ready);
