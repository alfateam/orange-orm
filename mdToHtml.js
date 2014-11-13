var marked = require('marked');
var fs = require('fs');

var str = fs.readFileSync('./README.md').toString();
var md = marked(str);
fs.writeFileSync('./README.html', md);
