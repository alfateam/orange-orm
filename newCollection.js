function newCollection() {
	var c = {};
	var ranges = [];

	c.addRange = function(range) {
		ranges.push(range);
	};

	c.forEach = function(callback) {
		for (var i = 0; i < ranges.length; i++) {
			ranges[i].forEach(callback);
		};
	};
	return c;
}

module.exports = newCollection;