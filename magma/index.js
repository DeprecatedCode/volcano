/**
 * Magma distributed component store
 * @author Nate Ferrero <volcanictortoise@gmail.com>
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const { env: { PORT = 11000 }} = process;

const basePath = path.join(process.cwd(), process.argv[3]);

if (!fs.existsSync(basePath)) {
  throw new Error('Path does not exist: ' + basePath);
}

const magmaModulesPath = path.join(basePath, 'magma-modules');

if (!fs.existsSync(magmaModulesPath)) {
  fs.mkdirSync(magmaModulesPath);
}

const file = (...filePath) => ({
  get read() {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(...filePath), (error, contents) => {
        if (error) {
          return reject(error);
        }
        resolve(contents.toString());
      });
    });
  },

  get readJSON() {
    return this.read.then(JSON.parse);
  },

  write(contents) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path.join(...filePath), contents, error => {
        if (error) {
          return reject(error);
        }
        resolve(contents);
      });
    });
  },

  writeJSON(contents) {
    return this.write(JSON.stringify(contents));
  }
});

const makeDirectory = (...directoryPath) => new Promise((resolve, reject) => {
  fs.mkdir(path.join(...directoryPath), (error) => {
    if (error) {
      return reject(error);
    }
    resolve();
  });
});

const CONTENT_TYPE_CSS   = { 'Content-Type': 'text/css' };
const CONTENT_TYPE_HTML  = { 'Content-Type': 'text/html' };
const CONTENT_TYPE_JS    = { 'Content-Type': 'application/javascript' };
const CONTENT_TYPE_JSON  = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_PLAIN = { 'Content-Type': 'text/plain' };

class Magma {
  async get(url) {
    console.log('GET', url);

    if (url === '/') {
      const head = '<head><link rel="stylesheet" href="stylesheet"></head>';
      const body = '<body><script src="client"></script></body>';
      return { headers: CONTENT_TYPE_HTML, contents: head + body };
    }

    if (url === '/client') {
      return file(__dirname, 'client.js').read.then(contents => (
        { headers: CONTENT_TYPE_JS, contents }
      ));
    }

    if (url === '/stylesheet') {
      return file(__dirname, 'stylesheet.css').read.then(contents => (
        { headers: CONTENT_TYPE_CSS, contents }
      ));
    }

    if (url === '/default') {
      const defaultFile = file(basePath, 'default.json');
      return defaultFile.read.catch(error =>
        this.createModule().then(module =>
          defaultFile.writeJSON(module)
        )
      ).then(JSON.parse);
    }

    const moduleMatch = url.match(/^\/module\/([^\/]{26})$/);
    if (moduleMatch) {
      const [fullMatch, uniqueId] = moduleMatch;
      const module = { uniqueId, events: [] };
      const moduleFile = file(magmaModulesPath, uniqueId, 'module.json');
      return moduleFile.readJSON.catch(error =>
        moduleFile.writeJSON(module)
      );
    }
  }

  async post(url) {
    console.log('POST', url);
  }

  async createModule() {
    const uniqueId = this.generateUniqueId();
    const module = { uniqueId };
    console.log('Creating module with id', uniqueId);
    return makeDirectory(magmaModulesPath, uniqueId).then(() => module);
  }

  generateUniqueId() {
    return [Date.now(), Math.random(), Math.random()]
      .map(x => x.toString(36))
      .map(x => x.replace(/0?\./, ''))
      .map(x => `${x}00000000`.substr(0, 8))
      .join('.');
  }

  get handler() {
    return (request, response) => {
      const method = request.method.toLowerCase();

      if (!(method in this)) {
        response.writeHead(404, CONTENT_TYPE_PLAIN);
        response.end('Not found');
        return;
      }

      this[method](request.url)
        .then(data => {
          if (!data) {
            response.writeHead(404, CONTENT_TYPE_PLAIN);
            response.end('Not found');
            return;
          }
          if (data.hasOwnProperty('headers')) {
            response.writeHead(200, data.headers);
            response.end(data.contents);
            return;
          }
          response.writeHead(200, CONTENT_TYPE_JSON);
          response.end(JSON.stringify(data));
        })
        .catch(error => {
          console.error(error);
          response.writeHead(500, CONTENT_TYPE_PLAIN);
          response.end('Server error');
        });
    };
  }
}

http.createServer(new Magma().handler).listen(PORT);
