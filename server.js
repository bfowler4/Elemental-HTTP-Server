const http = require(`http`);
const fs = require(`fs`);
const querystring = require('querystring');
const elementPageMaker = require(`./elementPageMaker.js`);
const indexPageMaker = require(`./indexPageMaker.js`);
const username = `devleaguer`;
const password = `hydroflask`;
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
  // Check authentication
  if (request.method === `POST` || request.method === `PUT` || request.method === `DELETE`) {
    if (!checkAuthentication(request, response)) {
      return;
    }
  }

  // Modify url if there is no .html 
  request.url = request.url === `/` ? `/index.html` : request.url;
  if (!request.url.endsWith(`.html`) && !request.url.endsWith(`.css`)) {
    request.url += `.html`;
  }

  // Handle methods
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
    default:
      response.setHeader(`Content-Type`, `application/json`);
      response.writeHead(501, `Not implemented`);
      response.write(JSON.stringify({ 'Error': `${request.method} method is not support by server.`}));
      response.end();
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
      sendInternalServerError(response);
    } else {
      if (method === `POST`) {
        files.elements[`/${path.split(`/`).slice(2).join(`/`)}`] = true;
        updateIndexPage(response);
      }
      sendSuccessMessage(response);
    }
  });
}

function deleteFile(response, path) {
  fs.unlink(`./public${path}`, (err) => {
    if (err) {
      sendInternalServerError(response);
    } else {
      delete files.elements[path];
      updateIndexPage(response);
      sendSuccessMessage(response);
    }
  });
}

function updateIndexPage(response) {
  fs.writeFile(`./public/index.html`, indexPageMaker(files.elements), (err) => {
    if (err) {
      sendInternalServerError(response);
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

function sendInternalServerError(response) {
  response.setHeader(`Content-Type`, `application/json`);
  response.writeHead(500, `Server-error`);
  response.write(JSON.stringify({ 'error': `Internal servor error.` }));
  response.end();
}

function sendForbiddenMessage(request, response) {
  response.setHeader(`Content-Type`, `application/json`);
  response.writeHead(403, `Forbidden`);
  response.write(JSON.stringify({ 'error': `resource ${request.url} cannot be deleted or modified` }));
  response.end();
}

function checkAuthentication(request, response) {
  if (request.headers.hasOwnProperty(`authorization`)) {
    let decodedString = new Buffer(request.headers.authorization.split(` `)[1], `base64`);
    decodedString = decodedString.toString();
    let user = decodedString.split(`:`)[0];
    let userPassword = decodedString.split(`:`)[1];
    if (user !== username || userPassword !== password) {
      response.setHeader(`WWW-Authenticate`, `Basic realm='Secure Area'`);
      response.writeHead(401, `Unauthorized`);
      response.write(`<html><body>Invalid Authentication Credentials</body></html>`);
      response.end();
      return false;
    }
    return true;
  } else {
    response.setHeader(`WWW-Authenticate`, `Basic realm='Secure Area'`);
    response.writeHead(401, `Unauthorized`);
    response.write(`<html><body>Not Authorized</body></html>`);
    response.end();
    return false;
  }
}