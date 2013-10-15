var filter;
var emptyFilter = {};

function act(c){	
	c.newEmptyFilter.expect().return(emptyFilter);
	c.emptyFilter  = emptyFilter;
	c.returned = c.sut(filter);
}

act.base = '../req';
module.exports = act;