const getSessionContext = require('./table/getSessionContext');
const executeQuery = require('./table/executeQueries/executeQuery');
const parameterized = require('./table/query/newParameterized');

async function advisoryLock(context, key, tables) {
	if (typeof key !== 'string' || key.length === 0 || key.includes('\0'))
		throw new TypeError('advisoryLock requires a non-empty string key without null characters');
	const session = getSessionContext(context);
	if (!session.transactionActive || session.transactionLess)
		throw new Error('advisoryLock requires an active local transaction');
	// ASCII keeps key encoding consistent across drivers, including VARCHAR bindings.
	const name = 'orange-orm:advisory:' + encodeURIComponent(key);
	switch (session.engine) {
	case 'pg':
		await query(context, 'SELECT pg_advisory_xact_lock((\'x\' || substr(md5(?), 1, 16))::bit(64)::bigint)', [name]);
		return;
	case 'mysql':
	case 'mariadb': {
		// Avoid stacking session locks, including concurrent calls for the same key.
		const locks = session.advisoryLockNames || (session.advisoryLockNames = new Map());
		if (!locks.has(name)) {
			const pending = query(context, 'SELECT GET_LOCK(SHA2(?, 256), 31536000) AS acquired', [name])
				.then(rows => {
					if (Number(rows[0]?.acquired) !== 1)
						throw new Error('Could not acquire advisory lock');
				});
			locks.set(name, pending);
		}
		await locks.get(name);
		return;
	}
	case 'mssql':
	case 'mssqlNative': {
		const rows = await query(context, `DECLARE @resource varchar(64), @result int;
SET @resource = CONVERT(varchar(64), HASHBYTES('SHA2_256', CONVERT(nvarchar(max), ?)), 2);
EXEC @result = sys.sp_getapplock @Resource = @resource, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = -1;
SELECT @result AS acquired;`, [name]);
		// Native and tedious drivers may return multiple result sets for a batch.
		const result = rows.flat().find(row => row?.acquired != null)?.acquired;
		if (result == null || Number(result) < 0)
			throw new Error('Could not acquire advisory lock (SQL Server result: ' + result + ')');
		return;
	}
	case 'oracle':
		await query(context, `DECLARE
  lock_name VARCHAR2(64);
  lock_handle VARCHAR2(128);
  lock_result INTEGER;
BEGIN
  SELECT RAWTOHEX(STANDARD_HASH(?, 'SHA256')) INTO lock_name FROM dual;
  DBMS_LOCK.ALLOCATE_UNIQUE_AUTONOMOUS(lock_name, lock_handle);
  lock_result := DBMS_LOCK.REQUEST(lock_handle, DBMS_LOCK.X_MODE, DBMS_LOCK.MAXWAIT, TRUE);
  IF lock_result NOT IN (0, 4) THEN
    RAISE_APPLICATION_ERROR(-20001, 'Could not acquire advisory lock (Oracle result: ' || lock_result || ')');
  END IF;
END;`, [name]);
		return;
	case 'sqlite':
		await lockSqlite(context, tables);
		return;
	default:
		throw new Error('advisoryLock is not supported by ' + session.engine);
	}
}

async function lockSqlite(context, tables = {}) {
	const physicalTables = await query(context, 'PRAGMA main.table_list');
	for (const table of Object.values(tables)) {
		if (!table?._columns?.length || typeof table._dbName !== 'string')
			continue;
		// Restrict the fallback to real tables in main, never temp tables or views.
		if (!physicalTables.some(actual => actual.schema === 'main' && actual.name === table._dbName && actual.type === 'table') || /^sqlite_/i.test(table._dbName))
			continue;
		const columns = await query(context, 'PRAGMA main.table_xinfo(' + quote(table._dbName) + ')');
		const column = table._columns.find(mapped => columns.some(actual => actual.name === mapped._dbName && actual.hidden === 0));
		if (!column)
			continue;
		const columnName = quote(column._dbName);
		await query(context, 'UPDATE main.' + quote(table._dbName) + ' SET ' + columnName + ' = ' + columnName + ' WHERE 0');
		return;
	}
	throw new Error('SQLite advisoryLock requires an existing mapped table with a writable column in the main database');
}

function quote(name) {
	return '"' + name.replace(/"/g, '""') + '"';
}

function query(context, sql, parameters) {
	return executeQuery(context, parameterized(sql, parameters));
}

async function releaseAdvisoryLocks(context) {
	const session = getSessionContext(context);
	const locks = session.advisoryLockNames;
	if (!locks)
		return;
	for (const [name, pending] of locks) {
		await pending;
		const rows = await query(context, 'SELECT RELEASE_LOCK(SHA2(?, 256)) AS released', [name]);
		if (Number(rows[0]?.released) !== 1)
			throw new Error('Could not release advisory lock');
		locks.delete(name);
	}
}

module.exports = { advisoryLock, releaseAdvisoryLocks };
