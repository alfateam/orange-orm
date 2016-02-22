function act(c){
	c.limit1 = 'limit 10';
	c.limit2 = ' limit 10';
	c.limit3 = '';
	c.expected = ' limit 10';
	c.expected3 = '';
	
	c.sut = require('../negotiateLimit');
	c.returned1 = c.sut(c.limit1);
	c.returned2 = c.sut(c.limit2);
	c.returned3 = c.sut(c.limit3);
}

module.exports = act;