// var arg = '2014-05-11 06:49:40.297-0200';
// var expected = new Date('2014-05-11 06:49:40.297-0200');
var arg = 'some date time string';

function act(c) {
	c.iso = {};
	c.tryParseISO.expect(arg).return(c.iso);
	c.returned = c.sut(arg);
}

module.exports = act;