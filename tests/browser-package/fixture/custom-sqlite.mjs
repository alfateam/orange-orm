// Self-contained, application-hosted module used only to check URL overrides.
export default function initialize() {
	return { oo1: { OpfsWlDb: class {
		constructor(filename) { this.filename = filename; }
		exec(options) { return options.returnValue === 'resultRows' ? [{ customModule: true }] : undefined; }
		close() {}
	} } };
}
