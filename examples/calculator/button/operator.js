const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');

const operatorButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(add|subtract|multiply|divide|power)$/);

  if (!match) {
    return notFound(response);
  }

  const operator = match[1];

  const operators = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/',
    power: '^'
  };

  success(response, {
    content: `
      <button lava-click="${operator}">${operators[operator]}</button>
    `
  });
});

operatorButton.listen(process.env.PORT, ready);
