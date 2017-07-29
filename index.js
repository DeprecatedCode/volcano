const child_process = require('child_process');
const fs            = require('fs');
const http          = require('http');
const path          = require('path');

const baseModulePath = path.join(process.cwd(), process.argv[2]);
let currentPort = parseInt(process.env.PORT) + 1;
const lavaResources = {};

const volcano = http.createServer((request, response) => {
  const allocationMatch = request.url.match(/^\/\.lava\/resources(\/.*)$/);
  if (allocationMatch) {
    return allocateResource(allocationMatch[1], request, response);
  }

  const resourcesMatch = request.url.match(/^\/\.lava\/(\d{4,})(\/.*)$/);
  if (resourcesMatch) {
    return resourceFor(parseInt(resourcesMatch[1]), resourcesMatch[2], request, response);
  }

  if (request.url === '/.lava/lava.js') {
    response.writeHead(200, {
      'Content-Type': 'application/javascript'
    });

    response.end(fs.readFileSync(path.join(__dirname, 'lava', 'lava.js')).toString());
  }

  if (request.url === '/') {
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });

    response.end(fs.readFileSync(path.join(baseModulePath, 'index.html')).toString());
  }

  response.writeHead(404);
  response.end();
});

volcano.listen(process.env.PORT);

function allocateResource(url, request, response) {
  function done() {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    });

    response.end(
      JSON.stringify(lavaResources[url])
    );
  }

  if (url in lavaResources) {
    return done();
  }

  let modulePath = path.join(baseModulePath, url);

  console.log(`LAVA • Starting new process '${url}' on port ${currentPort}`);

  const child = child_process.fork(modulePath, [], {
    env: {
      PORT: currentPort
    }
  });

  lavaResources[url] = {
    url,
    port: currentPort
  };
  currentPort++;

  child.on('message', function (message) {
    if (message.type === 'ready') {
      console.log(`LAVA • ... process '${url}' on port ${currentPort} is ready!`);
      done();
    }
  });
}

function resourceFor(port, path, request, response) {
  const hostname = 'localhost';
  const { headers, method } = request;
  headers.host = `${hostname}:${port}`;

  const options = {
    hostname,
    port,
    path,
    headers,
    method
  };

  console.log('LAVA • Proxy request', options.method, options.port, options.path);

  const resourceRequest = http.request(options, function(resourceResponse) {
    response.writeHead(resourceResponse.statusCode, resourceResponse.headers);
    return resourceResponse.pipe(response);
  });

  resourceRequest.on('error', function () {
    response.writeHead(500);
    response.end();
  });

  request.pipe(resourceRequest);
}
