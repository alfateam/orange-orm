function outboxTableSql(tableName = 'orange_sync_outbox') {
	return [
		`CREATE TABLE IF NOT EXISTS "${tableName}" (`,
		'"mutation_id" TEXT PRIMARY KEY,',
		'"table_name" TEXT NOT NULL,',
		'"patch_json" TEXT NOT NULL,',
		'"options_json" TEXT,',
		'"created_at_ms" INTEGER NOT NULL,',
		'"status" TEXT NOT NULL DEFAULT \'pending\',',
		'"last_error" TEXT,',
		'"attempts" INTEGER NOT NULL DEFAULT 0,',
		'"pushed_at_ms" INTEGER,',
		'"result_json" TEXT,',
		'CHECK ("status" IN (\'pending\', \'pushed\', \'failed\'))',
		');'
	].join(' ');
}

module.exports = outboxTableSql;
