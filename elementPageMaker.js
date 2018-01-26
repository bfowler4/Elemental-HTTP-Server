module.exports = createHTMLPage;

function createHTMLPage(obj) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${obj.elementName}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${obj.elementName}</h1>
  <h2>${obj.elementSymbol}</h2>
  <h3>Atomic number ${obj.elementAtomicNumber}</h3>
  <p>${obj.elementDescription}</p>
  <p><a href="/">back</a></p>
</body>
</html>`
}