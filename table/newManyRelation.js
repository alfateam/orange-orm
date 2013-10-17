var newManyLeg = require('./relation/newManyLeg');

function newManyRelation(joinRelation) {
	var c = {};

	c.joinRelation = joinRelation;

	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.toLeg = function() {
		return newManyLeg(c);
	};

	return c;
};

module.exports = newManyRelation;