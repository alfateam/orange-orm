export function createDemoMap(rdb) {
  return rdb.map((x) => ({
    team: x.table('team').map(({ column }) => ({
      id: column('id').numeric().primary().notNullExceptInsert(),
      name: column('name').string().notNull()
    })),
    person: x.table('person').map(({ column }) => ({
      id: column('id').numeric().primary().notNullExceptInsert(),
      teamId: column('teamId').numeric().notNullExceptInsert(),
      name: column('name').string().notNull(),
      email: column('email').string()
    })),
    project: x.table('project').map(({ column }) => ({
      id: column('id').numeric().primary().notNullExceptInsert(),
      ownerId: column('ownerId').numeric().notNullExceptInsert(),
      title: column('title').string().notNull(),
      status: column('status').string().notNull(),
      updatedAt: column('updatedAt').dateWithTimeZone()
    })),
    projectDetail: x.table('project_detail').map(({ column }) => ({
      id: column('id').numeric().primary().notNullExceptInsert(),
      projectId: column('projectId').numeric().notNullExceptInsert(),
      summary: column('summary').string(),
      riskLevel: column('riskLevel').string()
    })),
    task: x.table('task').map(({ column }) => ({
      id: column('id').numeric().primary().notNullExceptInsert(),
      projectId: column('projectId').numeric().notNullExceptInsert(),
      assigneeId: column('assigneeId').numeric(),
      title: column('title').string().notNull(),
      done: column('done').boolean(),
      sortOrder: column('sortOrder').numeric()
    }))
  })).map((x) => ({
    team: x.team.map(({ hasMany }) => ({
      people: hasMany(x.person).by('teamId')
    })),
    person: x.person.map(({ references }) => ({
      team: references(x.team).by('teamId').notNull()
    })),
    project: x.project.map(({ references, hasOne, hasMany }) => ({
      owner: references(x.person).by('ownerId').notNull(),
      detail: hasOne(x.projectDetail).by('projectId'),
      tasks: hasMany(x.task).by('projectId')
    })),
    projectDetail: x.projectDetail.map(({ references }) => ({
      project: references(x.project).by('projectId').notNull()
    })),
    task: x.task.map(({ references }) => ({
      project: references(x.project).by('projectId').notNull(),
      assignee: references(x.person).by('assigneeId')
    }))
  }));
}

export const demoDbOptions = {
  project: {
    updatedAt: {
      concurrency: 'overwrite'
    }
  }
};

export const syncTables = ['team', 'person', 'project', 'projectDetail', 'task'];
