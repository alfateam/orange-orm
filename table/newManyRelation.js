function newManyRelation(joinRelation) {
	var c = {};

	c.joinRelation = joinRelation;

	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	return c;
};

module.exports = newManyRelation;