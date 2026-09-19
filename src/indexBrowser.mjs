import orange from './indexBrowser.js';
import workerDefaults from './workerDefaults.js';
import { createSqliteWorker, createManagedSyncWorker } from './browser/workerFactories.mjs';

workerDefaults.createSqliteWorker = createSqliteWorker;
workerDefaults.createManagedSyncWorker = createManagedSyncWorker;

export default orange;
