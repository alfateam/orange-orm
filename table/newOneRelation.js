var newLeg = require('./relation/newOneLeg');

function newOneRelation(joinRelation) {
	var c = {};

	c.joinRelation = joinRelation;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	c.toLeg = function() {
		return newLeg(c);
	};

	return c;
}

module.exports = newOneRelation;