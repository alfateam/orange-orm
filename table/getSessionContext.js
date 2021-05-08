let useHook = require('../useHook');
let cls = require('node-cls');
let process = require('process');
// let newWhereSql = require('./query/singleQuery/newWhereSql');

let flags = require('../flags');
let browserContext = {
	changes: [],
	encodeBoolean: require('../pg/encodeBoolean'),
	encodeDate: require('../pg/encodeDate'),
	deleteFromSql: require('../pg/deleteFromSql'),
	selectForUpdateSql: require('../pg/selectForUpdateSql'),
	multipleStatements: true,
	accept: (caller) => caller.visitPg(),
	getManyDto,
	dbClient: {
		executeQuery
	},
	id: undefined,
};

async function getManyDto(table, filter, strategy) {
	let body = JSON.stringify(
		{
			table: table._dbName,
			columnDiscriminators: table._columnDiscriminators,
			formulaDiscriminators: table._formulaDiscriminators,
			sqlWhere: filter && filter.sql() ,
			parameters: filter && filter.parameters,
			strategy});
	// eslint-disable-next-line no-undef
	var headers = new Headers();
	headers.append('Content-Type', 'application/json');
	// eslint-disable-next-line no-undef
	let request = new Request(`${flags.url}`, {method: 'POST', headers, body});
	// eslint-disable-next-line no-undef
	let response = await fetch(request);
	if (response.status === 200) {
		return response.json();
	}
	else {
		let msg = response.json && await response.json() || `Status ${response.status} from server`;
		let e = new Error(msg);
		// @ts-ignore
		e.status = response.status;
		throw e;
	}
}

async function executeQuery(query, onCompleted) {
	let body = JSON.stringify({sql: query.sql(), parameters: query.parameters});
	// eslint-disable-next-line no-undef
	var headers = new Headers();
	headers.append('Content-Type', 'application/json');
	// eslint-disable-next-line no-undef
	let request = new Request(`${flags.url}`, {method: 'PUT', headers, body});
	try {
		// eslint-disable-next-line no-undef
		let response = await fetch(request);
		if (response.status === 200) {
			onCompleted(undefined, await response.json());
		}
		else {
			let msg = response.json && await response.json() || `Status ${response.status} from server`;
			let e = new Error(msg);
			// @ts-ignore
			e.status = response.status;
			onCompleted(e);
		}

	}
	catch(error) {
		onCompleted(error);
	}
}

function getSessionContext() {
	if (flags.url) {
		return browserContext;
	}
	if (useHook())
		return cls.getContext('rdb').rdb;
	else
		return process.domain.rdb;
}

module.exports = getSessionContext;