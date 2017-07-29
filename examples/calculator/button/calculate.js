const http = require('http');
const { success, notFound } = require('../lib/responses');

const calculateButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  success(response, {
    content: `
      <button>=</button>
    `
  });
});

calculateButton.listen(process.env.PORT);
