module.exports.readJSON = function (request, callback) {
  let contents = '';

  request.on('data', function (data) {
    contents += data;
  });

  request.on('end', function () {
    let parsed = JSON.parse(contents);
    callback(parsed);
  });
};
