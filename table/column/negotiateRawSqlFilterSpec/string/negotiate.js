function act(c){
	c.query = 'orderId > 2';
	c.sut(c.query);
}

module.exports = act;