function act(c){	
	c.isoWithJsTimezone = '2014-05-11T06:49:40.297-02:00';
	c.isoWithPgTimezone = '2014-05-11 06:49:40.297-02:00';
	c.isoWithoutTimezone = '2014-05-11 06:49:40.297';
	c.returned = c.sut(c.isoWithJsTimezone);
	c.returned2 = c.sut(c.isoWithPgTimezone);
	c.returned3 = c.sut(c.isoWithoutTimezone);
}

module.exports = act;