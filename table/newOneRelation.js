function newOneRelation(joinRelation) {
	var c = {};

	c.joinRelation = joinRelation;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	return c;
}

module.exports = newOneRelation;