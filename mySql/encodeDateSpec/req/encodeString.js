function act(c){

	c.dateText = '2014-02-16T06:49:40.297+0200';
	c.expected = "'2014-02-16T06:49:40.297'";

	c.dateText2 = '2014-02-16T06:49:40.297-0200';
	c.expected2 = "'2014-02-16T06:49:40.297'";

	c.dateText3 = '2014-02-16T06:49:40.297Z';
	c.expected3 = "'2014-02-16T06:49:40.297'";
	
	c.returned = c.sut(c.dateText);
	c.returned2 = c.sut(c.dateText2);
	c.returned3 = c.sut(c.dateText3);
}

module.exports = act;