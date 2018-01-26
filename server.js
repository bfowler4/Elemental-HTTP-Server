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
  request.url = request.url === `/` ? `/index.html` : request.url;
  if (!request.url.endsWith(`.html`) && !request.url.endsWith(`.css`)) {
    request.url += `.html`;
  }
  switch (request.method) {
    case `GET`:
      readFromFile(response, request.url);
      break;
    case `POST`:
      if (files.elements.hasOwnProperty(request.url)) {
        sendSuccessMessage(response);
      } else {
        createPage(request, response);
      }
      break;
    case `PUT`:
      if (files.hasOwnProperty(request.url)) {
        sendForbiddenMessage(request, response);
      } else if (files.elements.hasOwnProperty(request.url)) {
        createPage(request, response);
      } else {
        sendServerError(request, response);
      }
      break;
    case `DELETE`:
      if (files.hasOwnProperty(request.url)) {
        sendForbiddenMessage(request, response);
      } else if (files.elements.hasOwnProperty(request.url)) {
        deleteFile(response, request.url);
      } else {
        sendServerError(request, response);
      }
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
      if (method === `POST`) {
        files.elements[`/${path.split(`/`).slice(2).join(`/`)}`] = true;
        updateIndexPage();
      }
      sendSuccessMessage(response);
    }
  });
}

function deleteFile(response, path) {
  fs.unlink(`./public${path}`, (err) => {
    if (err) {
      console.log(err);
    } else {
      delete files.elements[path];
      updateIndexPage();
      sendSuccessMessage(response);
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

function sendSuccessMessage(response) {
  response.setHeader(`Content-Type`, `application/json`);
  response.writeHead(200, `OK`);
  response.write(JSON.stringify({ 'success': true }));
  response.end();
}

function sendServerError(request, response) {
  response.setHeader(`Content-Type`, `application/json`);
  response.writeHead(500, `Server-error`);
  response.write(JSON.stringify({ 'error': `resource ${request.url} does not exist` }));
  response.end();
}

function sendForbiddenMessage(request, response) {
  response.setHeader(`Content-Type`, `application/json`);
  response.writeHead(403, `Forbidden`);
  response.write(JSON.stringify({ 'error': `resource ${request.url} cannot be deleted or modified` }));
  response.end();
}