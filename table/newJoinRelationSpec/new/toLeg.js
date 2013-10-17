var newLeg;
var leg = {};
var sut;

function act(c){
	newLeg = c.newLeg;
	sut = c.sut;	
	newLeg.expect(sut).return(leg);
	c.leg = leg;
	c.returned = sut.toLeg();
}

act.base = '../new'
module.exports = act;