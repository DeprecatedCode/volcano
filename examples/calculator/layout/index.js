const http = require('http');
const { success, notFound } = require('../lib/responses');
const { ready } = require('../lib/notify-parent-process');
const { readJSON } = require('../lib/request-data');

const events = {};

function doMathOperation(_, leftDigit, operator, rightDigit) {
  var L = parseFloat(leftDigit)
  var R = parseFloat(rightDigit)
  switch (operator) {
    case '*': return L * R;
    case '/': return L / R;
    case '+': return L + R;
    case '-': return L - R;
  }
};

function calculate(input) {
  input = input.replace(/\s+/g, '');
  var mathRegex = /(\-?\d+\.?\d*)([\*\/\+\-])(\-?\d+\.?\d*)/;
  while(mathRegex.test(input)) {
    input = input.replace(mathRegex, doMathOperation);
  }
  return input;
}

events['/button/number'] = function (event, response) {
  const { state, action } = event;
  state.expression = state.expression === '0' ? action : state.expression += action;
  success(response, { state });
};

events['/button/clear'] = function (event, response) {
  const { state } = event;
  state.expression = '0';
  success(response, { state });
};

events['/button/calculate'] = function (event, response) {
  const { state } = event;
  if (state.expression === 'Error') {
    return success(response, { state });
  }
  state.expression = calculate(state.expression);
  success(response, { state });
};

events['/button/operator'] = function (event, response) {
  const operators = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/'
  };
  const { state, action } = event;
  if (state.expression === 'Error') {
    return success(response, { state });
  }
  const operator = ` ${operators[action]} `;
  const ending = state.expression.substr(state.expression.length - 3);
  if (ending.match(/^\s[-+*\/]\s$/)) {
    state.expression = state.expression.substr(0, state.expression.length - 3) + operator;
  }
  else {
    state.expression += operator;
  }
  success(response, { state });
};

const layout = http.createServer((request, response) => {
  console.log(request.url);
  const eventMatch = request.url === '/.event';

  if (eventMatch) {
    return readJSON(request, function (event) {
      return events[event.source](event, response);
    });
  }

  const match = request.url.match(/^\/$/);

  if (!match) {
    return notFound(response);
  }

  success(response, {
    state: { expression: '0' },
    events: ['/button/calculate', '/button/clear', '/button/number', '/button/operator'],
    content: `
      @lava(/display state:expression)
      @lava(/keypad)
    `
  });
});

layout.listen(process.env.PORT, ready);
