var newOneLeg = require('./newOneLeg');

function newLeg(relation) {	
	var c = newOneLeg(relation);
	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.expand = relation.expand;
	
	return c; 
}

module.exports = newLeg;
