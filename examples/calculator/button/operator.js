const http = require('http');
const { success, notFound } = require('../lib/responses');

const operatorButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(add|subtract|multiply|divide)$/);

  if (!match) {
    return notFound(response);
  }

  const operator = match[1];

  const operators = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/'
  };

  success(response, {
    content: `
      <button>${operators[operator]}</button>
    `
  });
});

operatorButton.listen(process.env.PORT);
