var createReadStreamCore = require('./createReadStreamCoreNative');
var Stream = require('stream');

function createReadStreamNative(table, db, filter, strategy, streamOptions) {
	var transformer = Stream.Transform({ objectMode: true });
	transformer._transform = function(chunk, _enc, cb) {
		var row = JSON.parse(chunk.result);
		transformer.push(row);
		cb();
	};

	return createReadStreamCore(table, db, filter, strategy, transformer, streamOptions);
}

module.exports = createReadStreamNative;