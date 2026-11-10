import type { TableClient } from '../../src/map2';

type Model = {
	project: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			name: { ' type': 'string', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: { tasks: { type: 'hasMany', target: 'task' } };
	};
	task: {
		columns: {
			projectId: { ' type': 'numeric', ' notNull': true };
			code: { ' type': 'string', ' notNull': true };
			name: { ' type': 'string', ' notNull': true };
		};
		primaryKey: readonly ['projectId', 'code'];
		relations: {};
	};
};

declare const project: TableClient<Model, 'project'>;
declare const task: TableClient<Model, 'task'>;

async function checkPlain() {
	const all = await project.getMany.plain();
	const name: string = all[0].name;
	// @ts-expect-error Plain arrays have no active record methods.
	all.saveChanges();
	// @ts-expect-error Plain rows have no active record methods.
	all[0].saveChanges();

	const rows = await project.getMany.plain({
		name: true,
		tasks: { name: true }
	});
	const adHocRows = await project.getMany.plain({
		matching: (current, { db, root }) => db.task.many({
			where: x => x.projectId.eq(root.id).and(x.projectId.eq(current.id)),
			code: true
		}),
		first: (_, { db, root }) => db.task.one({ where: x => x.projectId.eq(root.id) })
	});
	const taskName: string = rows[0].tasks[0].name;
	const code: string = adHocRows[0].matching[0].code;
	const firstName: string | undefined = adHocRows[0].first?.name;
	// @ts-expect-error Unselected columns are absent from the result type.
	rows[0].id;
	// @ts-expect-error Nested relations are also plain data.
	rows[0].tasks[0].saveChanges();
	// @ts-expect-error Ad-hoc relations are also plain data.
	adHocRows[0].matching[0].refresh();

	const one = await project.getOne.plain({ where: x => x.id.eq(1), tasks: true });
	// @ts-expect-error A single row can be missing.
	one.name;
	if (one) {
		const nested: string = one.tasks[0].name;
		// @ts-expect-error Plain rows have no delete method.
		one.delete();
		void nested;
	}
	const byId = await project.getById.plain(1, { name: true, tasks: { name: true } });
	if (byId) {
		const nested: string = byId.tasks[0].name;
		// @ts-expect-error Unselected columns remain absent for primary-key reads.
		byId.id;
		// @ts-expect-error Plain rows have no active record methods.
		byId.acceptChanges();
		void nested;
	}
	const adHocById = await project.getById.plain(1, {
		matching: (_, { db, root }) => db.task.many({ where: x => x.projectId.eq(root.id) })
	});
	const adHocName: string | undefined = adHocById?.matching[0].name;
	const composite = await task.getById.plain(1, 'A');
	const compositeName: string | undefined = composite?.name;
	await task.getById.plain(1, 'A', { name: true });
	// @ts-expect-error Composite keys require all primary-key arguments.
	task.getById.plain(1);
	// @ts-expect-error Primary-key values keep their declared types.
	task.getById.plain('1', 'A');
	// @ts-expect-error Unknown filter columns are rejected.
	project.getOne.plain({ where: x => x.missing.eq(1) });
	// @ts-expect-error Ad-hoc aliases cannot replace mapped properties.
	project.getMany.plain({ name: (_, { db }) => db.task.many() });
	// @ts-expect-error Primary-key reads validate ad-hoc aliases too.
	project.getById.plain(1, { name: (_, { db }) => db.task.many() });

	const tracked = await project.getOne();
	await tracked?.saveChanges();
	await (await project.getMany()).saveChanges();
	await (await project.getById(1))?.saveChanges();
	void [name, taskName, code, firstName, adHocName, compositeName];
}

void checkPlain;
