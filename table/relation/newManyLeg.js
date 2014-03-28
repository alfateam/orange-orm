var newOneLeg = require('./newOneLeg');

function newLeg(relation) {	
	var c = newOneLeg(relation);
	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	//TODO c.relation = relation;
	
	return c; 
}

module.exports = newLeg;
