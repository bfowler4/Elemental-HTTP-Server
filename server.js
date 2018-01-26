const http = require(`http`);
const fs = require(`fs`);
const querystring = require('querystring');
const elementPageMaker = require(`./elementPageMaker.js`);
const indexPageMaker = require(`./indexPageMaker.js`);
const files = {
  elements: {
    '/helium.html': true,
    '/hydrogen.html': true
  },
  '/404.html': true,
  '/index.html': true,
  '/css/styles.css': true
};

const PORT = process.env.port || 8080;

const server = http.createServer((request, response) => {
  switch (request.method) {
    case `GET`:
      let path = request.url === `/` ? `/index.html` : request.url;
      readFromFile(response, path);
      break;
    case `POST`:
      if (files.elements.hasOwnProperty(request.url)) {
        response.writeHead(200, `OK`);
        response.end();
      } else {
        createPage(request, response);
      }
      break;
    case `PUT`:
      if (files.elements.hasOwnProperty(request.url)) {
        createPage(request, response);
      } else {
        response.setHeader(`Content-Type`, `application/json`);
        response.writeHead(500, `Server error`);
        response.write(JSON.stringify({ 'error': `resource ${request.url} does not exist` }));
        response.end();
      }
      break;
    default:
      break;
  };
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

function readFromFile(response, path) {
  fs.readFile(`./public${path}`, (err, data) => {
    if (err) {
      readFromFile(response, `/404.html`);
    } else {
      if (path === `/404.html`) {
        response.writeHead(404, `NOT FOUND`);
      } else {
        response.writeHead(200, `OK`);
      }
      response.write(data);
      response.end();
    }
  });
}

function writeToFile(response, path, data, method) {
  fs.writeFile(path, data, (err) => {
    if (err) {
      console.log(err);
    } else {
      switch (method) {
        case `POST`:
          files.elements[`/${path.split(`/`).slice(2).join(`/`)}`] = true;
          updateIndexPage();
          response.setHeader(`Content-Type`, `application/json`);
          response.writeHead(201, `Created`);
          response.write(JSON.stringify({ 'success': true }));
          break;
        case `PUT`:
          response.setHeader(`Content-Type`, `application/json`);
          response.writeHead(200, `OK`);
          response.write(JSON.stringify({ 'success': true }));
          break;
      }
      response.end();
    }
  });
}

function updateIndexPage() {
  fs.writeFile(`./public/index.html`, indexPageMaker(files.elements), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`updated index page`);
    }
  })
}

function createPage(request, response) {
  request.setEncoding(`utf8`);
  request.on(`data`, (chunk) => {
    let dataObject = querystring.parse(chunk);
    let newPage = elementPageMaker(dataObject);
    writeToFile(response, `./public${request.url}`, newPage, request.method);
  });
}