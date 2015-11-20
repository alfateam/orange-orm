var createReadStreamCore = require('./createReadStreamCore');
var Stream = require('stream');

function createReadStream(table, db, filter, strategy) {
    var transformer = Stream.PassThrough({ objectMode: true });

    return createReadStreamCore(table, db, filter, strategy, transformer);
}

module.exports = createReadStream;
