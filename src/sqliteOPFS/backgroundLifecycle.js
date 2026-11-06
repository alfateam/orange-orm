/* global document */
// The host owns visibility. Workers receive state, never DOM or native APIs.
function isEnabled(options) {
	return !!(options && options.lifecycle && options.lifecycle.suspendWhenHidden === true);
}

function observe(options, listener) {
	if (!isEnabled(options)) return () => {};
	const source = options.lifecycle.visibility;
	if (source) {
		const unsubscribe = source.subscribe(listener);
		listener(source.isVisible());
		return unsubscribe;
	}
	if (typeof document === 'undefined') return () => {};
	const changed = () => listener(document.visibilityState !== 'hidden');
	document.addEventListener('visibilitychange', changed);
	changed();
	return () => document.removeEventListener('visibilitychange', changed);
}

function initialVisibility(options) {
	if (!isEnabled(options)) return true;
	if (typeof options.__orangeVisible === 'boolean') return options.__orangeVisible;
	const source = options.lifecycle.visibility;
	if (source) return source.isVisible();
	return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

function validate(options) {
	if (!isEnabled(options)) return;
	if (options.vfs !== 'opfs-sahpool')
		throw new Error('lifecycle.suspendWhenHidden requires vfs: "opfs-sahpool".');
	const source = options.lifecycle.visibility;
	if (source && (typeof source.isVisible !== 'function' || typeof source.subscribe !== 'function'))
		throw new Error('lifecycle.visibility requires isVisible() and subscribe(listener).');
}

module.exports = { isEnabled, observe, initialVisibility, validate };
