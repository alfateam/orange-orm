const getSessionSingleton = require('../table/getSessionSingleton');
const getManyDtoCore = require('../getManyDto');

function getManyDto(context, _table, _filter, _strategy) {
	const _getManyDto = getSessionSingleton(context, 'getManyDto') || getManyDtoCore;
	return _getManyDto.apply(null, arguments);
}

module.exports = getManyDto;