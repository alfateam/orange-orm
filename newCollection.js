//TODO support for sending collection elements as param list
function newCollection() {
	var c = {};
	var ranges = [];

//TODO c.Add = function() {};
//TODO c.toArray = function() {};

	c.addRange = function(otherCollection) {
		ranges.push(otherCollection);
	};

	c.forEach = function(callback) {
		for (var i = 0; i < ranges.length; i++) {
			ranges[i].forEach(callback);
		};
	};
	return c;
}

module.exports = newCollection;