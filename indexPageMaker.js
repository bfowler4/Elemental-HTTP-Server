module.exports = indexPageMaker;

function indexPageMaker(filesObject) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>The Elements</title>
    <link rel="stylesheet" href="/css/styles.css">
  </head>
  <body>
    <h1>The Elements</h1>
    <h2>These are all the known elements.</h2>
    <h3>These are ${Object.keys(filesObject).length}</h3>
    ${createElementsList(filesObject)}
  </body>
  </html>`;
}

function createElementsList(filesObject) {
  let keys = Object.keys(filesObject);
  let list = keys.reduce((accum, curr) => {
    let element = curr.charAt(1).toUpperCase() + curr.split(`.html`)[0].slice(2);
    accum += `<li><a href="${curr}">${element}</a></li>`;
    return accum;
  }, `<ol>`);
  return list + `</ol>`;
}