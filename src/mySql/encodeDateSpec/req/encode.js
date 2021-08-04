function act(c){
	var valueAsText = '2014-02-16T06:49:40.297-0200';
	c.expected = "'2014-02-16T06:49:40.297'";
	c.date = {
		toISOString: function() {
			return valueAsText;
		}
	};
		
	c.returned = c.sut(c.date);
}

module.exports = act;