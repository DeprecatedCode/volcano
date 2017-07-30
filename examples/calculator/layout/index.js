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
    case '^': return Math.pow(L, R);
  }
};

function calculate(input) {
  input = input.replace(/\s+/g, '');
  var mathRegex = /(\-?\d+\.?\d*)([-+*^\/])(\-?\d+\.?\d*)/;
  while(mathRegex.test(input)) {
    input = input.replace(mathRegex, doMathOperation);
  }

  if (Number.isFinite(parseFloat(input))) {
    return input;
  }

  return 'Error';
}

function endsWithOperator(expression) {
  const ending = expression.substr(expression.length - 3);
  return ending.match(/^\s[-+*^\/]\s$/);
}

events['/button/number'] = function (event, response) {
  const { state, action } = event;
  if (state.expression === 'Error') {
    state.expression = action;
  }
  else {
    state.expression = state.expression === '0' ?
      action : state.expression + action;
  }
  success(response, { state });
};

events['/button/clear'] = function (event, response) {
  const { state } = event;
  state.expression = '0';
  success(response, { state });
};

events['/button/decimal'] = function (event, response) {
  const { state } = event;

  if (state.expression === 'Error') {
    state.expression = '0';
  }

  let ending = state.expression.match(/(\s+|[\d\.]+)$/);
  ending = ending ? ending[0] : '';
  console.log(ending);

  if (ending[ending.length - 1] === ' ') {
    state.expression += '0.';
  }
  else if (ending.indexOf('.') === -1) {
    state.expression += '.';
  }

  success(response, { state });
};

events['/button/calculate'] = function (event, response) {
  const { state } = event;
  if (state.expression === 'Error' || endsWithOperator(state.expression)) {
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
    divide: '/',
    power: '^'
  };
  const { state, action } = event;
  if (state.expression === 'Error') {
    return success(response, { state });
  }
  const operator = ` ${operators[action]} `;
  if (endsWithOperator(state.expression)) {
    state.expression = state.expression.substr(0, state.expression.length - 3) + operator;
  }
  else {
    state.expression += operator;
  }
  success(response, { state });
};

events['/button/round'] = function (event, response) {
  const { state } = event;
  if (state.expression === 'Error' || endsWithOperator(state.expression)) {
    return success(response, { state });
  }
  state.expression = Math.round(calculate(state.expression)).toString();
  success(response, { state });
};

events['/button/sqrt'] = function (event, response) {
  const { state } = event;
  if (state.expression === 'Error' || endsWithOperator(state.expression)) {
    return success(response, { state });
  }
  state.expression = Math.sqrt(calculate(state.expression)).toString();
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
    events: [
      '/button/calculate',
      '/button/clear',
      '/button/decimal',
      '/button/number',
      '/button/operator',
      '/button/round',
      '/button/sqrt'
    ],
    content: `
      @lava(/display state:expression)
      @lava(/keypad)
    `
  });
});

layout.listen(process.env.PORT, ready);
