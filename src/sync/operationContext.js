const stringify = require('../client/stringify');
const executeQuery = require('../query');
const getSessionSingleton = require('../table/getSessionSingleton');
const setSessionSingleton = require('../table/setSessionSingleton');

const sessionKey = 'syncTransactionContext';
const captureKey = 'syncOutboxCapture';
const memoryByMutationId = new Map();

function createSyncTransactionContext(context, memory) {
	return {
		context: isObject(context) && !Array.isArray(context) ? context : {},
		memory: memory === undefined ? {} : memory
	};
}

function setSyncTransactionContext(context, txContext) {
	if (!context)
		return;
	if (context.__orangeDbWorkerTransactionId !== undefined) {
		context.__orangeSyncTransactionContext = txContext;
		return;
	}
	setSessionSingleton(context, sessionKey, txContext);
}

function getSyncTransactionContext(context) {
	if (!context)
		return undefined;
	if (context.__orangeSyncTransactionContext)
		return context.__orangeSyncTransactionContext;
	try {
		return getSessionSingleton(context, sessionKey);
	}
	catch (_e) {
		return undefined;
	}
}

async function flushSyncTransactionContext(context) {
	const txContext = getSyncTransactionContext(context);
	if (!txContext)
		return null;
	const state = getOutboxCaptureState(context);
	const metadata = toSyncOperationMetadata(txContext.context, state && state.id);
	if (state)
		await updateOutboxOperationColumns(context, state, metadata);
	return metadata;
}

async function updateOutboxOperationFromContext(context, state) {
	const txContext = getSyncTransactionContext(context);
	if (!txContext || !state)
		return null;
	const metadata = toSyncOperationMetadata(txContext.context, state.id);
	await updateOutboxOperationColumns(context, state, metadata);
	return metadata;
}

function toSyncOperationMetadata(context, mutationId) {
	const payload = serializeSyncPayload(context);
	const keys = Object.keys(payload);
	if (keys.length === 0)
		return null;
	const operationName = typeof payload.operation === 'string' && payload.operation.length > 0
		? payload.operation
		: undefined;
	return {
		mutationId,
		operationId: mutationId,
		operationName,
		operationJson: stringify(payload),
		context: payload
	};
}

function serializeSyncPayload(context) {
	if (context === undefined || context === null)
		return {};
	if (!isObject(context) || Array.isArray(context))
		throw new Error('ctx.context must be a JSON serializable object.');
	let json;
	try {
		json = JSON.stringify(context);
	}
	catch (_e) {
		throw new Error('ctx.context must be JSON serializable.');
	}
	if (json === undefined)
		throw new Error('ctx.context must be a JSON serializable object.');
	try {
		const parsed = JSON.parse(json);
		if (!isObject(parsed) || Array.isArray(parsed))
			throw new Error('ctx.context must be a JSON serializable object.');
		return parsed;
	}
	catch (e) {
		if (e && e.message && e.message.startsWith('ctx.context'))
			throw e;
		throw new Error('ctx.context must be JSON serializable.');
	}
}

function registerSyncOperationMemory(mutationId, memory) {
	if (typeof mutationId !== 'string' || mutationId.length === 0 || memory === undefined)
		return;
	memoryByMutationId.set(mutationId, memory);
}

function getSyncOperationMemory(mutationId) {
	if (typeof mutationId !== 'string')
		return undefined;
	return memoryByMutationId.get(mutationId);
}

function deleteSyncOperationMemory(mutationId) {
	if (typeof mutationId === 'string')
		memoryByMutationId.delete(mutationId);
}

function withSyncOperationMemory(event) {
	if (!event || !event.mutationId || event.memory !== undefined)
		return event;
	const memory = getSyncOperationMemory(event.mutationId);
	if (memory === undefined)
		return event;
	return {
		...event,
		memory
	};
}

function finalizeSyncOperationMemory(event) {
	if (!event || !event.mutationId)
		return;
	if (event.ok || event.retryable === false)
		deleteSyncOperationMemory(event.mutationId);
}

async function updateOutboxOperationColumns(context, state, metadata) {
	const assignments = outboxOperationAssignments(metadata);
	await executeQuery(context, [
		'UPDATE "orange_sync_outbox"',
		`SET ${assignments.join(', ')}`,
		`WHERE "mutation_id" = ${sqlStringLiteral(state.id)}`
	].join(' '));
}

function outboxOperationAssignments(metadata) {
	if (!metadata) {
		return [
			'"operation_id" = NULL',
			'"operation_name" = NULL',
			'"operation_json" = NULL'
		];
	}
	return [
		`"operation_id" = ${sqlNullableStringLiteral(metadata.operationId)}`,
		`"operation_name" = ${sqlNullableStringLiteral(metadata.operationName)}`,
		`"operation_json" = ${sqlNullableStringLiteral(metadata.operationJson)}`
	];
}

function getOutboxCaptureState(context) {
	try {
		return getSessionSingleton(context, captureKey);
	}
	catch (_e) {
		return undefined;
	}
}

function isObject(value) {
	return value && value === Object(value);
}

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

function sqlNullableStringLiteral(value) {
	if (value === undefined || value === null)
		return 'NULL';
	return sqlStringLiteral(value);
}

module.exports = {
	createSyncTransactionContext,
	deleteSyncOperationMemory,
	finalizeSyncOperationMemory,
	flushSyncTransactionContext,
	getSyncOperationMemory,
	registerSyncOperationMemory,
	serializeSyncPayload,
	setSyncTransactionContext,
	toSyncOperationMetadata,
	updateOutboxOperationFromContext,
	withSyncOperationMemory
};
