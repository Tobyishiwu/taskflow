import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

function getToken() { return localStorage.getItem('access_token'); }

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); window.location.href = '/'; return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || JSON.stringify(data));
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) throw new Error('Cannot connect to server. Make sure Django and Express are running.');
    throw err;
  }
}

export const auth = {
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  login: async (credentials) => { const data = await request('/auth/login/', { method: 'POST', body: JSON.stringify(credentials) }); localStorage.setItem('access_token', data.access); localStorage.setItem('refresh_token', data.refresh); return data; },
  logout: () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); },
  me: () => request('/auth/me/'),
};

export const projectsApi = {
  list: (search = '') => request(`/projects/${search ? `?search=${search}` : ''}`),
  create: (data) => request('/projects/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/projects/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/projects/${id}/`, { method: 'DELETE' }),
};

export const tasksApi = {
  list: (filters = {}) => { const params = new URLSearchParams(filters).toString(); return request(`/tasks/${params ? `?${params}` : ''}`); },
  create: (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/tasks/${id}/`, { method: 'DELETE' }),
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try { const me = await auth.me(); setUser(me); } catch { auth.logout(); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadUser(); }, [loadUser]);
  const login = async (credentials) => { await auth.login(credentials); const me = await auth.me(); setUser(me); };
  const register = async (formData) => { const res = await auth.register(formData); localStorage.setItem('access_token', res.access); localStorage.setItem('refresh_token', res.refresh); setUser(res.user); };
  const logout = () => { auth.logout(); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

const PRIORITY_COLORS = { high: '#e85d5d', medium: '#f0a030', low: '#667eea' };
const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#888' },
  { key: 'in_progress', label: 'In Progress', color: '#667eea' },
  { key: 'done', label: 'Done', color: '#30c060' },
];

function TaskCard({ task, onDelete, onDragStart, isDark }) {
  return (
    <div draggable onDragStart={() => onDragStart(task.id)}
      style={{ background: isDark ? '#13131c' : '#fff', border: `1px solid ${isDark ? '#2a2a3a' : '#e0e0ec'}`, borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#667eea'}`, borderRadius: 8, padding: '12px', marginBottom: 8, cursor: 'grab', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: isDark ? '#ddd' : '#1a1a2e', lineHeight: 1.4, textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.6 : 1, flex: 1 }}>{task.title}</p>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#444' : '#ccc', fontSize: 16, padding: '0 0 0 8px', lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
      {task.description && <p style={{ margin: '0 0 8px', fontSize: 11, color: isDark ? '#555' : '#aaa', lineHeight: 1.4 }}>{task.description}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
        {task.due_date && <span style={{ fontSize: 10, color: isDark ? '#444' : '#bbb', marginLeft: 'auto' }}>{task.due_date}</span>}
      </div>
    </div>
  );
}

function Column({ column, tasks, onDrop, onDelete, onAddTask, isDark }) {
  const [over, setOver] = useState(false);
  return (
    <div style={{ width: 270, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: column.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#666' : '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{column.label}</span>
        <span style={{ fontSize: 11, background: isDark ? '#2a2a3a' : '#e8e8f0', color: isDark ? '#555' : '#aaa', padding: '1px 7px', borderRadius: 10 }}>{tasks.length}</span>
        <button onClick={() => onAddTask(column.key)} style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: 6, background: 'transparent', border: `1px solid ${isDark ? '#2a2a3a' : '#dddde8'}`, color: isDark ? '#555' : '#bbb', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
      <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); onDrop(e, column.key); }}
        style={{ background: over ? (isDark ? '#1e1e2e' : '#eeeef8') : (isDark ? '#1a1a24' : '#e8e8f2'), border: `1px solid ${over ? column.color : (isDark ? '#2a2a3a' : '#dddde8')}`, borderRadius: 12, padding: 8, minHeight: 100, transition: 'all 0.2s' }}>
        {tasks.map(t => <TaskCard key={t.id} task={t} onDelete={onDelete} onDragStart={(id) => e => e.dataTransfer?.setData('taskId', id)} isDark={isDark} />)}
        {tasks.length === 0 && <div style={{ textAlign: 'center', color: isDark ? '#333' : '#ccc', fontSize: 12, padding: '20px 0' }}>Drop tasks here</div>}
      </div>
    </div>
  );
}

function TaskBoard({ projectId, initialTasks, isDark }) {
  const [taskList, setTaskList] = useState(initialTasks);
  const [showForm, setShowForm] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [dragId, setDragId] = useState(null);
  const [error, setError] = useState('');

  const handleDrop = async (e, newStatus) => {
    const taskId = parseInt(e.dataTransfer?.getData('taskId') || dragId);
    if (!taskId) return;
    try {
      await tasksApi.update(taskId, { status: newStatus });
      setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { setError('Failed to move task.'); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksApi.delete(taskId); setTaskList(prev => prev.filter(t => t.id !== taskId)); } catch { setError('Failed to delete task.'); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const created = await tasksApi.create({ ...newTask, status: showForm, project: projectId, due_date: newTask.due_date || null });
      setTaskList(prev => [created, ...prev]);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowForm(null);
    } catch (err) { setError(err.message); }
  };

  const inp = { width: '100%', padding: '8px 12px', marginBottom: 10, border: `1px solid ${isDark ? '#3a3a4a' : '#ddd'}`, borderRadius: 7, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', background: isDark ? '#1a1a24' : '#fff', color: isDark ? '#ddd' : '#1a1a2e' };

  return (
    <div>
      {error && <div style={{ background: '#e85d5d22', color: '#e85d5d', padding: '8px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#e85d5d', cursor: 'pointer', fontWeight: 700 }}>✕</button></div>}
      {showForm && (
        <form onSubmit={handleAdd} style={{ background: isDark ? '#1a1a24' : '#fff', border: `1px solid ${isDark ? '#2a2a3a' : '#e0e0ec'}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: isDark ? '#aaa' : '#555' }}>New task in "{COLUMNS.find(c => c.key === showForm)?.label}"</h4>
          <input required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title *" style={inp} />
          <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Description (optional)" rows={2} style={{ ...inp, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={{ ...inp, flex: 1, marginBottom: 0 }}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={{ ...inp, flex: 1, marginBottom: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" style={{ background: '#667eea', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add Task</button>
            <button type="button" onClick={() => setShowForm(null)} style={{ background: 'transparent', color: isDark ? '#666' : '#aaa', border: `1px solid ${isDark ? '#3a3a4a' : '#ddd'}`, padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </form>
      )}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map(col => (
          <Column key={col.key} column={col} tasks={taskList.filter(t => t.status === col.key)}
            onDrop={(e, status) => handleDrop(e, status)}
            onDelete={handleDelete}
            onAddTask={setShowForm}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
}

function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { mode === 'login' ? await login({ username: form.username, password: form.password }) : await register(form); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>TaskFlow</h1>
          <p style={{ margin: '6px 0 0', color: '#555', fontSize: 13 }}>Django · Express · React</p>
        </div>
        <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 16, padding: 28 }}>
          <div style={{ display: 'flex', background: '#13131c', borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: mode === m ? '#667eea' : 'transparent', color: mode === m ? '#fff' : '#555', transition: 'all 0.2s' }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
          {error && <div style={{ background: '#e85d5d22', color: '#e85d5d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
          <form onSubmit={handle}>
            {mode === 'register' && <div style={{ display: 'flex', gap: 10 }}>
              <input placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={authInp} />
              <input placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={authInp} />
            </div>}
            <input required placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={authInp} />
            {mode === 'register' && <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={authInp} />}
            <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={authInp} />
            {mode === 'register' && <input required type="password" placeholder="Confirm password" value={form.password2} onChange={e => setForm({ ...form, password2: e.target.value })} style={authInp} />}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 0', background: loading ? '#3a3a4a' : '#667eea', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const authInp = { width: '100%', padding: '11px 14px', marginBottom: 12, border: '1px solid #2a2a3a', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', background: '#13131c', color: '#ddd', fontFamily: 'inherit', outline: 'none' };

function Dashboard() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [projectList, setProjectList] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const d = isDark;
  const bg = d ? '#0f0f13' : '#f0f2f7';
  const surface = d ? '#1a1a24' : '#fff';
  const surface2 = d ? '#13131c' : '#f8f8fc';
  const border = d ? '#2a2a3a' : '#e0e0ec';
  const text = d ? '#e2e2e8' : '#1a1a2e';
  const muted = d ? '#555' : '#aaa';

  useEffect(() => {
    projectsApi.list().then(data => {
      const list = Array.isArray(data) ? data : (data?.results || []);
      setProjectList(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addActivity = (msg) => setActivity(prev => [{ msg, time: 'just now' }, ...prev.slice(0, 4)]);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const p = await projectsApi.create(newProject);
      setProjectList(prev => [p, ...prev]);
      setActiveProject(p);
      setShowNewProject(false);
      setShowSidebar(false);
      setNewProject({ name: '', description: '' });
      addActivity(`Project "${p.name}" created`);
    } catch (err) { setError(err.message); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete project and all tasks?')) return;
    try {
      await projectsApi.delete(id);
      setProjectList(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    } catch { setError('Failed to delete.'); }
  };

  const tasks = activeProject?.tasks || [];
  const done = tasks.filter(t => t.status === 'done').length;
  const high = tasks.filter(t => t.priority === 'high').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const PROJECT_COLORS = ['#667eea', '#e85d5d', '#30c060', '#f0a030', '#a855f7', '#06b6d4'];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Segoe UI', sans-serif", transition: 'all 0.2s' }}>

      {/* NAV */}
      <nav style={{ height: 52, background: surface, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: muted, padding: '0 4px' }}>☰</button>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: text }}>TaskFlow</span>
        <span style={{ fontSize: 10, background: d ? '#667eea22' : '#667eea12', color: '#667eea', padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid #667eea33' }}>Full-Stack Demo</span>
        <div style={{ flex: 1 }} />
        {/* Theme toggle */}
        <div style={{ background: d ? '#2a2a3a' : '#f0f0f8', border: `1px solid ${border}`, borderRadius: 20, padding: '3px 4px', display: 'flex', gap: 2 }}>
          {['Dark', 'Light'].map(t => (
            <button key={t} onClick={() => setIsDark(t === 'Dark')} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: (isDark && t === 'Dark') || (!isDark && t === 'Light') ? '#667eea' : 'transparent', color: (isDark && t === 'Dark') || (!isDark && t === 'Light') ? '#fff' : muted, transition: 'all 0.2s' }}>{t}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: muted }}>👋 {user?.first_name || user?.username}</span>
        <button onClick={logout} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>Sign Out</button>
      </nav>

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Overlay */}
        {showSidebar && <div onClick={() => setShowSidebar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 98 }} />}

        {/* SIDEBAR */}
        <aside style={{ width: 240, background: surface2, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 52, left: showSidebar ? 0 : -260, height: 'calc(100vh - 52px)', zIndex: 99, transition: 'left 0.25s ease', overflowY: 'auto' }}>
          <div style={{ padding: '12px 12px 8px' }}>
            <button onClick={() => { setShowNewProject(true); setShowSidebar(false); }} style={{ width: '100%', padding: '10px 0', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ New Project</button>
          </div>

          <div style={{ padding: '12px 12px 4px', fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 1 }}>Projects</div>
          {loading && <p style={{ fontSize: 13, color: muted, padding: '8px 16px' }}>Loading...</p>}
          {projectList.map((p, i) => (
            <div key={p.id} onClick={() => { setActiveProject(p); setShowSidebar(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, margin: '2px 8px', cursor: 'pointer', background: activeProject?.id === p.id ? '#667eea22' : 'transparent', transition: 'all 0.15s' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PROJECT_COLORS[i % PROJECT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: activeProject?.id === p.id ? '#667eea' : text, flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 11, background: d ? '#2a2a3a' : '#e8e8f0', color: muted, padding: '1px 6px', borderRadius: 10 }}>{p.task_count?.total || 0}</span>
              <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} style={{ background: 'none', border: 'none', color: d ? '#333' : '#ddd', cursor: 'pointer', fontSize: 15 }}>×</button>
            </div>
          ))}
          {!loading && projectList.length === 0 && <p style={{ fontSize: 13, color: muted, padding: '12px 16px', textAlign: 'center' }}>No projects yet</p>}

          <div style={{ height: 1, background: border, margin: '12px 12px' }} />
          <div style={{ padding: '0 12px 4px', fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 1 }}>Activity</div>
          {activity.length === 0 && <p style={{ fontSize: 12, color: muted, padding: '8px 16px' }}>No recent activity</p>}
          {activity.map((a, i) => (
            <div key={i} style={{ padding: '8px 12px', margin: '2px 8px' }}>
              <div style={{ fontSize: 12, color: '#667eea' }}>{a.msg}</div>
              <div style={{ fontSize: 11, color: muted }}>{a.time}</div>
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: 20, minHeight: 'calc(100vh - 52px)', marginLeft: 0 }}>
          {error && <div style={{ background: '#e85d5d22', color: '#e85d5d', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}<button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#e85d5d', cursor: 'pointer', marginLeft: 8, fontWeight: 700 }}>✕</button></div>}

          {showNewProject && (
            <form onSubmit={createProject} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, color: text }}>New Project</h3>
              <input required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="Project name *" style={{ ...dashInp(d) }} />
              <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Description (optional)" rows={2} style={{ ...dashInp(d), resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ background: '#667eea', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Create Project</button>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ background: 'transparent', color: muted, border: `1px solid ${border}`, padding: '9px 20px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </form>
          )}

          {activeProject ? (
            <div>
              {/* Stats Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Tasks', value: tasks.length, sub: 'across 3 columns', subColor: '#667eea' },
                  { label: 'Done', value: done, sub: `${pct}% complete`, subColor: '#30c060' },
                  { label: 'High Priority', value: high, sub: 'needs attention', subColor: '#e85d5d' },
                ].map(s => (
                  <div key={s.label} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 16px', minWidth: 110 }}>
                    <div style={{ fontSize: 11, color: muted, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: text }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.subColor, marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
                <div style={{ flex: 1, background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 16px', minWidth: 160 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: muted, marginBottom: 8 }}>
                    <span>Progress</span>
                    <span style={{ color: '#667eea', fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: d ? '#2a2a3a' : '#e8e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 10, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>

              {/* Board Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: text }}>{activeProject.name}</h2>
                  {activeProject.description && <p style={{ margin: 0, color: muted, fontSize: 13 }}>{activeProject.description}</p>}
                </div>
                <button onClick={() => setShowNewProject(false)} style={{ background: '#667eea', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Task</button>
              </div>

              <TaskBoard projectId={activeProject.id} initialTasks={tasks} isDark={isDark} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
              <h2 style={{ color: text, margin: '0 0 8px', fontSize: 20 }}>Select a Project</h2>
              <p style={{ color: muted, fontSize: 14 }}>Tap ☰ to open the menu and choose a project.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const dashInp = (d) => ({ width: '100%', padding: '9px 12px', marginBottom: 10, border: `1px solid ${d ? '#2a2a3a' : '#e0e0ec'}`, borderRadius: 7, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', background: d ? '#13131c' : '#f8f8fc', color: d ? '#ddd' : '#1a1a2e' });

function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#555', background: '#0f0f13' }}>Loading…</div>;
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}