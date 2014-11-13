var marked = require('marked');
var fs = require('fs');

var str = fs.readFileSync('./docs.md').toString();
var md = marked(str);
fs.writeFileSync('./docs.html', md);
