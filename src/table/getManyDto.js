let tryGetSessionContext = require('../table/tryGetSessionContext');

function getManyDto(table, _filter, _strategy) {
	const _getManyDto = tryGetSessionContext().getManyDto;

	if (_getManyDto)
		return _getManyDto.apply(null, arguments);
	else {
		let args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		return table.getMany.apply(null, args)
			.then((rows) => {
				args.shift();
				return rows.toDto.apply(rows, args);
			});
	}
}

module.exports = getManyDto;