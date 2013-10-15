var filter = {};

function act(c){	
	c.filter  = filter;
	c.returned = c.sut(filter);
}

act.base = '../req';
module.exports = act;