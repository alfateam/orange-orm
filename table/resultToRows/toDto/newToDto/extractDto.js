var newObject = require('../../../../newObject');

function extractDto(a, b, dto) {
	if (arguments.length == 3) 
		return dto;
	return newObject();
};

module.exports = extractDto;