import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { projects as projectsApi } from './api';
import TaskBoard from './components/TaskBoard';

function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '', first_name: '', last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password });
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: '100%',
        maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>TaskFlow</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Django + Express + React</p>
        </div>

        <div style={{ display: 'flex', borderRadius: 8, background: '#f0f0f0', padding: 3, marginBottom: 20 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#1a1a2e' : '#888',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fff5f5', color: '#dc3545', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handle}>
          {mode === 'register' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="First name" value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })} style={authInput} />
              <input placeholder="Last name" value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })} style={authInput} />
            </div>
          )}
          <input required placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })} style={authInput} />
          {mode === 'register' && (
            <input type="email" placeholder="Email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} style={authInput} />
          )}
          <input required type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} style={authInput} />
          {mode === 'register' && (
            <input required type="password" placeholder="Confirm password" value={form.password2}
              onChange={e => setForm({ ...form, password2: e.target.value })} style={authInput} />
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px 0',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [projectList, setProjectList] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list()
      .then(data => {
        if (Array.isArray(data)) setProjectList(data);
        else if (data && Array.isArray(data.results)) setProjectList(data.results);
        else setProjectList([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const p = await projectsApi.create(newProject);
      setProjectList([p, ...projectList]);
      setActiveProject(p);
      setShowNewProject(false);
      setShowSidebar(false);
      setNewProject({ name: '', description: '' });
    } catch (err) { setError(err.message); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete project and all its tasks?')) return;
    try {
      await projectsApi.delete(id);
      const updated = projectList.filter(p => p.id !== id);
      setProjectList(updated);
      if (activeProject?.id === id) setActiveProject(null);
    } catch { setError('Failed to delete project.'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Top Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e9ecef',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hamburger for mobile */}
          <button onClick={() => setShowSidebar(!showSidebar)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, padding: '0 4px', color: '#333',
            display: 'block'
          }}>☰</button>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>TaskFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#666' }}>👋 {user?.first_name || user?.username}</span>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid #dee2e6', color: '#666',
            padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12
          }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ display: 'flex', position: 'relative' }}>

        {/* Overlay for mobile */}
        {showSidebar && (
          <div onClick={() => setShowSidebar(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 98, display: 'block'
          }} />
        )}

        {/* Sidebar */}
        <aside style={{
          width: 260, background: '#fff', borderRight: '1px solid #e9ecef',
          padding: '16px 0', display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 56, left: showSidebar ? 0 : -280,
          height: 'calc(100vh - 56px)', zIndex: 99,
          transition: 'left 0.25s ease', boxShadow: showSidebar ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        }}>
          <div style={{ padding: '0 14px 14px', borderBottom: '1px solid #f0f0f0' }}>
            <button onClick={() => setShowNewProject(true)} style={{
              width: '100%', padding: '10px 0',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontWeight: 700, fontSize: 13
            }}>+ New Project</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: '#aaa',
              textTransform: 'uppercase', letterSpacing: 1,
              padding: '0 8px', margin: '0 0 8px'
            }}>Projects</p>

            {loading && <p style={{ fontSize: 13, color: '#aaa', padding: '0 8px' }}>Loading...</p>}

            {projectList.map(p => (
              <div key={p.id} onClick={() => { setActiveProject(p); setShowSidebar(false); }}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  background: activeProject?.id === p.id ? '#f0f4ff' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activeProject?.id === p.id ? '#667eea' : '#333' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{p.task_count?.total || 0} tasks</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 15 }}>×</button>
              </div>
            ))}

            {!loading && projectList.length === 0 && (
              <p style={{ fontSize: 13, color: '#bbb', padding: '16px 8px', textAlign: 'center' }}>
                No projects yet.<br />Create your first one!
              </p>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 'calc(100vh - 56px)', width: '100%' }}>
          {error && (
            <div style={{
              background: '#fff5f5', color: '#dc3545', padding: '10px 16px',
              borderRadius: 8, marginBottom: 16, fontSize: 13
            }}>
              {error}
              <button onClick={() => setError('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#dc3545', fontWeight: 700, marginLeft: 8
              }}>✕</button>
            </div>
          )}

          {showNewProject && (
            <form onSubmit={createProject} style={{
              background: '#fff', borderRadius: 12, padding: 18,
              marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>New Project</h3>
              <input required value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Project name *" style={dashInput} />
              <textarea value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Description (optional)" rows={2}
                style={{ ...dashInput, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={dashBtn('#667eea')}>Create</button>
                <button type="button" onClick={() => setShowNewProject(false)} style={dashBtn('#6c757d')}>Cancel</button>
              </div>
            </form>
          )}

          {activeProject ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>
                  {activeProject.name}
                </h2>
                {activeProject.description && (
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>{activeProject.description}</p>
                )}
              </div>
              <TaskBoard projectId={activeProject.id} initialTasks={activeProject.tasks || []} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 50, marginBottom: 14 }}>📋</div>
              <h2 style={{ color: '#333', margin: '0 0 8px', fontSize: 18 }}>Select a Project</h2>
              <p style={{ color: '#888', fontSize: 13 }}>
                Tap ☰ to open the menu and choose a project.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#888' }}>
      Loading…
    </div>
  );
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

const authInput = {
  width: '100%', padding: '10px 14px', marginBottom: 12,
  border: '1px solid #dee2e6', borderRadius: 8, fontSize: 14,
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
};

const dashInput = {
  width: '100%', padding: '9px 12px', marginBottom: 10,
  border: '1px solid #dee2e6', borderRadius: 6, fontSize: 13,
  boxSizing: 'border-box', fontFamily: 'inherit'
};

const dashBtn = (bg) => ({
  background: bg, color: '#fff', border: 'none', padding: '9px 20px',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600
});