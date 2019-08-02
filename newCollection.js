function newCollection() {
	var c = {};
	var initialArgs = [];
	for (var i = 0; i < arguments.length; i++) {
		initialArgs.push(arguments[i]);
	}
	var ranges = [initialArgs];

	c.addRange = function(otherCollection) {
		ranges.push(otherCollection);
	};

	c.add = function(element) {
		c.addRange([element]);
	};

	c.toArray = function() {
		var result = [];
		c.forEach(onEach);
		return result;

		function onEach(element) {
			result.push(element);
		}
	};

	c.forEach = function(callback) {
		var index = 0;
		for (var i = 0; i < ranges.length; i++) {
			ranges[i].forEach(onEach);
		}

		function onEach(element) {
			callback(element, index);
			index++;
		}

	};

	Object.defineProperty(c, 'length', {
		enumerable: false,
		get: function() {
			var result = 0;
			for (var i = 0; i < ranges.length; i++) {
				result += ranges[i].length;
			}
			return result;
		},
	});


	return c;
}

module.exports = newCollection;