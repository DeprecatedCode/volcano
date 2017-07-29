const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');
const { readJSON } = require('../lib/request-data');

const display = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  if (request.method === 'POST') {
    return readJSON(request, function (input) {
      success(response, {
        content: input.state
      });
    });
  }

  success(response, {
    content: '0'
  });
});

display.listen(process.env.PORT, ready);
