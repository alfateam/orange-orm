var createReadStreamCore = require('./createReadStreamDefault');
var Stream = require('stream');

function createJSONReadStream(table, db, filter, strategy, streamOptions) {
	var transformer = Stream.Transform({ objectMode: true });
	var started;
	transformer._transform = function(obj, enc, cb) {
		var data = JSON.stringify(obj);
		if (started)
			transformer.push(',' + data);
		else {
			transformer.push('[');
			transformer.push(data);
			started = true;
		}
		cb();
	};

	transformer._flush = function(cb) {
		transformer.push(']');
		cb();
	};

	var objectStream = createReadStreamCore(table, db, filter, strategy, streamOptions);
	objectStream.on('error', onError);
	return objectStream.pipe(transformer);

	function onError(e) {
		transformer.emit('error', e);
	}
}

module.exports = createJSONReadStream;
