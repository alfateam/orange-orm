var createReadStreamCore = require('./createReadStreamCoreNative');
var Stream = require('stream');

function createReadStreamNative(table, db, filter, strategy, streamOptions) {
	var transformer = Stream.Transform({ objectMode: true });
	transformer._transform = function(chunk, _enc, cb) {
		let result = chunk.result;
		if (typeof result === 'string')
			result = JSON.parse(result);
		transformer.push(result);
		cb();
	};

	return createReadStreamCore(table, db, filter, strategy, transformer, streamOptions);
}

module.exports = createReadStreamNative;