var createReadStreamCore = require('./createReadStreamCore');
var Stream = require('stream');

function createReadStream(table, db, filter, strategy) {
    var transformer = Stream.Transform({ objectMode: true });
    transformer._transform = function(chunk, enc, cb) {
    	var obj = JSON.parse(chunk['result']);
    	console.log(obj);
        transformer.push(chunk['result']);
        cb();
    };
    return createReadStreamCore(table, db, filter, strategy, transformer);
}

module.exports = createReadStream;
