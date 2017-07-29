const child_process = require('child_process');
const fs            = require('fs');
const http          = require('http');
const path          = require('path');

const volcano = http.createServer((request, response) => {
  const allocationMatch = request.url.match(/^\/\.lava\/resources(\/.*)$/);
  if (allocationMatch) {
    return allocateResource(allocationMatch[1], request, response);
  }

  const resourcesMatch = request.url.match(/^\/\.lava\/(\d{4,})(\/.*)$/);
  if (resourcesMatch) {
    return resourceFor(parseInt(resourcesMatch[1]), resourcesMatch[2], request, response);
  }

  const match = request.url.match(/^\/$/);

  if (!match) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/html'
  });

  response.end(fs.readFileSync('examples/calculator/index.html').toString());
});

volcano.listen(process.env.PORT);

const baseModulePath = path.join(process.cwd(), process.argv[2]);
let currentPort = parseInt(process.env.PORT) + 1;
const lavaResources = {};

function allocateResource(url, request, response) {
  function done() {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    });

    response.end(
      JSON.stringify(lavaResources[url])
    );
  }

  if (!(url in lavaResources)) {
    let modulePath = path.join(baseModulePath, url);

    console.log(`Starting new process '${url}' on port ${currentPort}`);

    child_process.fork(modulePath, [], {
      env: {
        PORT: currentPort
      }
    });

    lavaResources[url] = {
      url,
      port: currentPort
    };
    currentPort++;

    return setTimeout(done, 200);
  }

  done();
}

function resourceFor(port, fullPath, request, response) {
  const hostname = 'localhost';
  const { headers, method } = request;
  let [modulePath, path] = `${fullPath}:/`.split(':');
  headers.host = `${hostname}:${port}`;

  const options = {
    hostname,
    port,
    path,
    headers,
    method
  };

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
