var createReadStreamCore = require('./createReadStreamCore');
var Stream = require('stream');

function createReadStream(table, db, filter, strategy) {
    var transformer = Stream.Transform({ objectMode: true });
    transformer._transform = function(chunk, enc, cb) {
        transformer.push(JSON.stringify(chunk));
        cb();
    };
    return createReadStreamCore(table, db, filter, strategy, transformer);
}

module.exports = createReadStream;
