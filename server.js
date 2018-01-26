const http = require(`http`);
const fs = require(`fs`);
const querystring = require('querystring');

const PORT = process.env.port || 8080;

const server = http.createServer((request, response) => {
  switch (request.method) {
    case `GET`:
      let path = request.url === `/` ? `/index.html` : request.url;
      readFromFile(response, path);
      break;
    case `POST`:
      request.setEncoding(`utf8`);
      request.on(`data`, (chunk) => {
        console.log(querystring.parse(chunk));
      });
    default:
      break;
  };
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

function createSuccessHeader(response) {
  response.writeHead(200, `OK`);
}

function createFileNotFoundHeader(response) {
  response.writeHead(404, `NOT FOUND`);
}

function readFromFile(response, path) {
  fs.readFile(`./public${path}`, (err, data) => {
    if (err) {
      readFromFile(response, `/404.html`);
    } else {
      if (path === `/404.html`) {
        createFileNotFoundHeader(response);
      } else {
        createSuccessHeader(response);
      }
      response.write(data);
      response.end();
    }
  });
}