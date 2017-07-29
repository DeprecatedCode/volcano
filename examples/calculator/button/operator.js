const http = require('http');

const operatorButton = http.createServer((request, response) => {
  const match = request.url.match(/^\/(add|subtract|multiply|divide)$/);

  if (!match) {
    response.writeHead(404);
    response.end();
    return;
  }

  const operator = match[1];

  const operators = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/'
  };

  response.writeHead(200, {
    'Content-Type': 'text/html'
  });

  response.end(`
    <button>${operators[operator]}</button>
  `);
});

operatorButton.listen(process.env.PORT);
