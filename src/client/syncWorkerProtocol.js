const alwaysForwardedEvents = Object.freeze([
	'sync',
	'sync-error',
	'error',
	'initial-ready',
	'sync-progress',
	'operation'
]);

const errorMarker = '__orangeSyncWorkerError';
const preservedErrorProperties = [
	'status',
	'code',
	'response',
	'config',
	'syncRecovered',
	'syncResult',
	'mutationIds'
];

function serializeError(error) {
	if (error === undefined || error === null)
		return undefined;
	const result = {
		[errorMarker]: true,
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
	for (const property of preservedErrorProperties) {
		if (error && error[property] !== undefined)
			result[property] = error[property];
	}
	if (error && error.cause !== undefined) {
		result.cause = isErrorLike(error.cause)
			? serializeError(error.cause)
			: error.cause;
	}
	return result;
}

function deserializeError(error, fallbackMessage = 'Sync worker request failed.') {
	if (error instanceof Error)
		return error;
	const result = new Error(error && error.message ? error.message : fallbackMessage);
	if (error && error.name)
		result.name = error.name;
	if (error && error.stack)
		result.stack = error.stack;
	for (const property of preservedErrorProperties) {
		if (error && error[property] !== undefined)
			result[property] = error[property];
	}
	if (error && error.cause !== undefined) {
		result.cause = error.cause && error.cause[errorMarker]
			? deserializeError(error.cause)
			: error.cause;
	}
	return result;
}

function serializeEventPayload(payload) {
	if (!payload || payload !== Object(payload) || payload.error === undefined)
		return payload;
	return {
		...payload,
		error: serializeError(payload.error)
	};
}

function deserializeEventPayload(payload) {
	if (!payload || payload !== Object(payload) || !payload.error || !payload.error[errorMarker])
		return payload;
	return {
		...payload,
		error: deserializeError(payload.error)
	};
}

function isAlwaysForwardedEvent(event) {
	return alwaysForwardedEvents.includes(event)
		|| typeof event === 'string' && event.startsWith('operation:');
}

function isErrorLike(value) {
	return value instanceof Error
		|| value && value === Object(value) && typeof value.message === 'string';
}

module.exports = {
	alwaysForwardedEvents,
	deserializeError,
	deserializeEventPayload,
	isAlwaysForwardedEvent,
	serializeError,
	serializeEventPayload
};
