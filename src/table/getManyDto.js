const tryGetSessionContext = require('../table/tryGetSessionContext');
const getManyDtoCore = require('../getManyDto');


function getManyDto(_table, _filter, _strategy) {
	const _getManyDto = tryGetSessionContext().getManyDto || getManyDtoCore;
	return _getManyDto.apply(null, arguments);
}

module.exports = getManyDto;