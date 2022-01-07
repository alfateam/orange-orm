function getManyDto(table, _filter, _strategy) {
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

module.exports = getManyDto;