var arg = {}, 
	arg2 = {};
var alias = '_2';

function act(c){
	c.shallowEqualFilter = {};
	c.shallowBetweenFilter = {};
	c.equalFilter = {};
	c.betweenFilter = {};

	c.column.equal.expect(arg,alias).return(c.shallowEqualFilter);
	c.column.between.expect(arg,arg2,alias).return(c.shallowBetweenFilter);

	c.newSubFilter.expect(c.relations,c.shallowEqualFilter).return(c.equalFilter);
	c.newSubFilter.expect(c.relations,c.shallowBetweenFilter).return(c.betweenFilter);

	c.returnedEqualFilter = c.sut.equal(arg);
	c.returnedBetweenFilter = c.sut.between(arg,arg2);
}

module.exports = act;