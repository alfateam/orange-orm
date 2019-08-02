function emitEvent() {
	var callbacks = [];
	var emit = function() {

		var copy = callbacks.slice(0, callbacks.length);
		for (var i = 0; i < copy.length; i++) {
			var callback = copy[i];
			callback.apply(null,arguments);
		}
	};

	emit.add = function(callback) {
		callbacks.push(callback);
	};

	emit.tryAdd = function(callback) {
		if (callback)
			emit.add(callback);
	};

	emit.remove = function(callback) {
		for (var i = 0; i < callbacks.length; i++) {
			if(callbacks[i] === callback){
				callbacks.splice(i,1);
				return;
			}
		}
	};

	emit.tryRemove = function(callback) {
		if(callback)
			emit.remove(callback);
	};

	emit.clear = function() {
		callbacks = [];
	};

	return emit;
}

module.exports = emitEvent;