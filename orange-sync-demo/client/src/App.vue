<script setup>
import { computed, onMounted, ref } from 'vue';
import { db, initLocalSchema } from './db.js';

const projects = ref([]);
const people = ref([]);
const selectedProjectId = ref(null);
const status = ref('Booting local database');
const busy = ref(false);
const lastSync = ref(null);
const newTaskTitle = ref('');
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3055';

const selectedProject = computed(() =>
  projects.value.find((project) => project.id === selectedProjectId.value) || projects.value[0]
);

onMounted(async () => {
  await run('Ready local SQLite', async () => {
    await initLocalSchema();
    await refreshLocal();
  });
  await db.syncClient.start();
  await refreshLocal();
  lastSync.value = new Date();
  status.value = 'Idle';
});

async function refreshLocal() {
  const [projectRows, personRows] = await Promise.all([
    db.project.getAll({
      owner: { team: {} },
      detail: {},
      tasks: { assignee: {} }
    }),
    db.person.getAll({ team: {} })
  ]);
  projects.value = projectRows.sort((a, b) => a.id - b.id);
  people.value = personRows.sort((a, b) => a.name.localeCompare(b.name));
  if (!selectedProjectId.value && projects.value.length > 0)
    selectedProjectId.value = projects.value[0].id;
}

async function pull() {
  await run('Pulling server changes', async () => {
    await db.syncClient.pull();
    lastSync.value = new Date();
    await refreshLocal();
  });
}

async function push() {
  await run('Pushing local changes', async () => {
    await db.syncClient.push();
    lastSync.value = new Date();
    await refreshLocal();
  });
}

async function syncBoth() {
  await push();
  await pull();
}

async function createProject() {
  const owner = people.value[0];
  if (!owner)
    return;
  await run('Creating local project', async () => {
    const stamp = new Date().toLocaleTimeString();
    const project = await db.project.insert({
      ownerId: owner.id,
      title: `Local sync test ${stamp}`,
      status: 'draft',
      updatedAt: new Date(),
      detail: {
        summary: 'Created locally. Push sends the patch transaction to Postgres.',
        riskLevel: 'low'
      },
      tasks: [
        {
          assigneeId: owner.id,
          title: 'Push this local task',
          done: false,
          sortOrder: 1
        }
      ]
    });
    selectedProjectId.value = project.id;
    await refreshLocal();
  });
}

async function toggleTask(task) {
  await run('Saving local task change', async () => {
    const row = await db.task.getById(task.id);
    row.done = !row.done;
    await row.saveChanges();
    await refreshLocal();
  });
}

async function addTask() {
  const project = selectedProject.value;
  if (!project || !newTaskTitle.value.trim())
    return;
  await run('Adding local task', async () => {
    await db.task.insert({
      projectId: project.id,
      assigneeId: project.ownerId,
      title: newTaskTitle.value.trim(),
      done: false,
      sortOrder: (project.tasks || []).length + 1
    });
    newTaskTitle.value = '';
    await refreshLocal();
  });
}

async function flipStatus() {
  const project = selectedProject.value;
  if (!project)
    return;
  await run('Saving local project change', async () => {
    const row = await db.project.getById(project.id);
    row.status = row.status === 'active' ? 'paused' : 'active';
    row.updatedAt = new Date();
    await row.saveChanges();
    await refreshLocal();
  });
}

async function createServerChange() {
  await run('Creating server-side change', async () => {
    await fetch(`${serverUrl}/api/seed-server-change`, { method: 'POST' });
    await pull();
  });
}

async function run(message, fn) {
  busy.value = true;
  status.value = message;
  try {
    await fn();
    status.value = 'Idle';
  }
  catch (e) {
    status.value = e.message || String(e);
  }
  finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">OS</span>
        <div>
          <h1>Orange Sync</h1>
          <p>Vue + sqliteOPFS + Postgres</p>
        </div>
      </div>

      <section class="status-panel">
        <div class="status-line">
          <span class="icon">~</span>
          <span>{{ status }}</span>
        </div>
        <p v-if="lastSync">Last sync {{ lastSync.toLocaleTimeString() }}</p>
        <p v-else>Waiting for first pull</p>
      </section>

      <div class="actions">
        <button @click="syncBoth" :disabled="busy"><span class="icon">R</span> Sync</button>
        <button @click="push" :disabled="busy"><span class="icon">U</span> Push</button>
        <button @click="pull" :disabled="busy"><span class="icon">D</span> Pull</button>
        <button @click="createServerChange" :disabled="busy"><span class="icon">S</span> Server edit</button>
      </div>
    </aside>

    <section class="content">
      <header class="toolbar">
        <div>
          <p class="eyebrow">Projects</p>
          <h2>Two-way sync workspace</h2>
        </div>
        <button class="primary" @click="createProject" :disabled="busy"><span class="icon">+</span> New local project</button>
      </header>

      <div class="grid">
        <nav class="project-list">
          <button
            v-for="project in projects"
            :key="project.id"
            :class="{ active: selectedProject?.id === project.id }"
            @click="selectedProjectId = project.id"
          >
            <strong>{{ project.title }}</strong>
            <span>{{ project.owner?.name || 'No owner' }} · {{ project.status }}</span>
          </button>
        </nav>

        <article v-if="selectedProject" class="detail">
          <div class="detail-head">
            <div>
              <p class="eyebrow">{{ selectedProject.owner?.team?.name || 'Team' }}</p>
              <h3>{{ selectedProject.title }}</h3>
            </div>
            <button @click="flipStatus" :disabled="busy">Toggle status</button>
          </div>

          <dl class="facts">
            <div>
              <dt>Owner</dt>
              <dd>{{ selectedProject.owner?.name }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ selectedProject.status }}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{{ selectedProject.detail?.riskLevel || 'none' }}</dd>
            </div>
          </dl>

          <p class="summary">{{ selectedProject.detail?.summary }}</p>

          <section class="tasks">
            <div class="task-input">
              <input v-model="newTaskTitle" placeholder="Add a local task" @keydown.enter="addTask" />
              <button @click="addTask" :disabled="busy || !newTaskTitle.trim()">+</button>
            </div>

            <button
              v-for="task in selectedProject.tasks || []"
              :key="task.id"
              class="task"
              @click="toggleTask(task)"
            >
              <span class="check" :class="{ done: task.done }">✓</span>
              <span>
                <strong>{{ task.title }}</strong>
                <small>{{ task.assignee?.name || 'Unassigned' }}</small>
              </span>
            </button>
          </section>
        </article>

        <article v-else class="empty">
          Pull from server to load demo data.
        </article>
      </div>
    </section>
  </main>
</template>
