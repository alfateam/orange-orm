function act(c) { 
	c.returned = c.sut(c.table,c.arg1,c.arg2);
}

act.base = '../../new';
module.exports = act;