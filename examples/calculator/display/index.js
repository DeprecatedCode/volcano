const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');
const { readJSON } = require('../lib/request-data');

const display = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  function formatExpression(expression) {
    return ` ${expression} `.replace(/(\d+)(\.?\d*)/g, function (_, whole, part) {
      return whole.replace(/(\d)((\d{3})+)$/g, function (_, first, rest) {
        return first + rest.replace(/\d{3}/g, function (match) {
          return `,${match}`;
        });
      }) + part;
    }).trim();
  }

  if (request.method === 'POST') {
    return readJSON(request, function (input) {
      success(response, {
        content: formatExpression(input.state)
      });
    });
  }

  success(response, {
    content: '0'
  });
});

display.listen(process.env.PORT, ready);
