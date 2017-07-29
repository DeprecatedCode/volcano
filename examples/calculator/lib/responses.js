module.exports.success = function (response, object) {
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(object));
};

module.exports.notFound = function (response) {
  response.writeHead(404);
  response.end();
};

module.exports.serverError = function (response) {
  response.writeHead(500);
  response.end();
};
