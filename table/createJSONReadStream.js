var createReadStreamCore = require('./createReadStreamCore');
var Stream = require('stream');

function createJSONReadStream(table, db, filter, strategy) {
    var transformer = Stream.Transform({ objectMode: true });
    var started;
    transformer._transform = function(chunk, enc, cb) {
    	if (started)
        	transformer.push(',' + chunk['result']);
        else {
        	transformer.push('[');
        	transformer.push(chunk['result']);
        	started = true;
        } 
        cb();
    };

    transformer._flush = function(cb)
    {
    	transformer.push(']');
    	cb();
    };

    return createReadStreamCore(table, db, filter, strategy, transformer);
}

module.exports = createJSONReadStream;
