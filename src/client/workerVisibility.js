/* global document */
// This source only observes the host. It does not suspend or reopen storage.
module.exports = function workerVisibility(source) {
	if (source) return source;
	return {
		isVisible: () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
		subscribe(listener) {
			if (typeof document === 'undefined') return () => {};
			const changed = () => listener(document.visibilityState !== 'hidden');
			document.addEventListener('visibilitychange', changed);
			return () => document.removeEventListener('visibilitychange', changed);
		}
	};
};
