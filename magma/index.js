const fs            = require('fs');
const http          = require('http');
const path          = require('path');

const baseModulePath = path.join(process.cwd(), process.argv[2]);
let port = parseInt(process.env.PORT) || 15000;
let processPort = port + 1;

const defaultComponentPath = path.join(baseModulePath, 'default.magma');
const componentsPath = path.join(baseModulePath, 'magma-components');

try {
  fs.statSync(componentsPath);
}
catch (e) {
  fs.mkdirSync(componentsPath);
}

function uniqueId() {
  return [Date.now(), Math.random(), Math.random()]
    .map(x => x.toString(36).replace('0', ''))
    .join('');
}

function componentBasePath(id) {
  return path.join(componentsPath, id);
}

function createComponent() {
  const id = uniqueId();
  const path = componentBasePath(id);
  fs.mkdirSync(path);
  return id;
}

const magma = http.createServer((request, response) => {
  if (request.url === '/.magma/magma.js') {
    response.writeHead(200, {
      'Content-Type': 'application/javascript'
    });

    response.end(fs.readFileSync(path.join(__dirname, 'magma.js')).toString());
  }

  if (request.url === '/.magma/default') {
    response.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    let defaultComponent;
    try {
      defaultComponent = fs.readFileSync(defaultComponentPath).toString();
    }
    catch (e) {
      defaultComponent = createComponent();
      fs.writeFileSync(defaultComponentPath, defaultComponent);
    }

    response.end(defaultComponent);
  }

  if (request.url === '/') {
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });

    response.end(fs.readFileSync(path.join(__dirname, 'index.html')).toString());
  }

  response.writeHead(404);
  response.end();
});

magma.listen(port, function (error) {
  if (error) {
    console.error(error);
  }
  else {
    console.log(`Magma • Listening on http://localhost:${port}`);
  }
});
