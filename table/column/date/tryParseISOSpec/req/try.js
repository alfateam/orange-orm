function act(c){	
	c.iso = '2014-05-11T06:49:40.297-02:00';
	c.iso2 = '2014-05-11 06:49:40.297-02:00';
	c.returned = c.sut(c.iso);
	c.returned2 = c.sut(c.iso2);
}

module.exports = act;