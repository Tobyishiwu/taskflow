import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { projects as projectsApi } from './api';
import TaskBoard from './components/TaskBoard';

// ─── MODERN COMPONENT STYLES (CSS-in-JS + Variables) ────────────────────────
const CSS_TOKENS = `
  :root {
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --radius-lg: 12px;
    --radius-md: 8px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
    --shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
  
  .tf-input {
    width: 100%; padding: 10px 14px; margin-bottom: 14px;
    border: 1px solid var(--border); borderRadius: var(--radius-md); fontSize: 14px;
    box-sizing: border-box; transition: all 0.2s ease; background: #fafafa;
  }
  .tf-input:focus {
    outline: none; border-color: var(--primary); background: #fff;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
  .tf-btn-primary {
    background: var(--primary); color: #fff; border: none; padding: 10px 20px;
    border-radius: var(--radius-md); cursor: pointer; font-size: 14px; font-weight: 600;
    transition: all 0.2s ease;
  }
  .tf-btn-primary:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
  .tf-btn-primary:active:not(:disabled) { transform: translateY(0); }
  
  .project-item {
    transition: all 0.2s ease;
  }
  .project-item:hover {
    background: #f1f5f9 !important;
  }
  .delete-btn { opacity: 0; transition: opacity 0.2s; }
  .project-item:hover .delete-btn { opacity: 1; }
`;

// ─── AUTH FORMS ───────────────────────────────────────────────────────────────

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
        if (form.password !== form.password2) throw new Error("Passwords do not match");
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #4f46e5, #31108f)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <style>{CSS_TOKENS}</style>
      <div style={{ background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8, display: 'inline-block', background: '#eeebff', padding: '12px', borderRadius: '50%' }}>⚡</div>
          <h1 style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>TaskFlow</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Django + Express + React Dashboard</p>
        </div>

        <div style={{ display: 'flex', borderRadius: '8px', background: '#f1f5f9', padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#0f172a' : '#64748b',
              boxShadow: mode === m ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: 16, fontSize: 13, border: '1px solid #fee2e2', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handle}>
          {mode === 'register' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <input placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="tf-input" />
              <input placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="tf-input" />
            </div>
          )}
          <input required placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="tf-input" />
          {mode === 'register' && (
            <input type="email" placeholder="Email layout" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="tf-input" />
          )}
          <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="tf-input" />
          {mode === 'register' && (
            <input required type="password" placeholder="Confirm password" value={form.password2} onChange={e => setForm({ ...form, password2: e.target.value })} className="tf-input" />
          )}
          <button type="submit" disabled={loading} className="tf-btn-primary" style={{ width: '100%', padding: '12px 0', marginTop: 8, fontSize: 15 }}>
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user, logout } = useAuth();
  const [projectList, setProjectList] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
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
      setNewProject({ name: '', description: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete project and all its tasks?')) return;
    try {
      await projectsApi.delete(id);
      setProjectList(projectList.filter(p => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    } catch {
      setError('Failed to delete project.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style>{CSS_TOKENS}</style>
      
      {/* Top Header Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', letterSpacing: '-0.5px' }}>TaskFlow</span>
          <span style={{ fontSize: 11, background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>Demo App</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>👋 {user?.first_name || user?.username}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Workspace Frame Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: 280, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 16px' }}>
            <button onClick={() => setShowNewProject(true)} className="tf-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>+</span> New Project
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px', margin: '0 0 12px' }}>Your Projects</p>
            {loading && <p style={{ fontSize: 13, color: '#94a3b8', padding: '0 8px' }}>Loading workspace...</p>}
            
            {projectList.map(p => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div key={p.id} onClick={() => setActiveProject(p)} className="project-item" style={{
                  padding: '12px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: 4,
                  background: isSelected ? '#eff6ff' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ overflow: 'hidden', paddingRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#1d4ed8' : '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: isSelected ? '#3b82f6' : '#94a3b8', marginTop: 2 }}>{p.task_count?.total || 0} tasks</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="delete-btn"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>&times;</button>
                </div>
              );
            })}
            
            {!loading && projectList.length === 0 && (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '24px 8px', textAlign: 'center', lineHeight: 1.5 }}>
                No active spaces.<br /><span style={{fontSize: 12, color: '#cbd5e1'}}>Click above to begin!</span>
              </p>
            )}
          </div>
        </aside>

        {/* Main Panel Content Window Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: 24, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fee2e2' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>✕</button>
            </div>
          )}

          {showNewProject && (
            <form onSubmit={createProject} style={{ background: '#fff', borderRadius: '12px', padding: 24, marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Create Workspace</h3>
              <input required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="Project name *" className="tf-input" />
              <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Description (optional)" rows={3} className="tf-input" style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="tf-btn-primary">Create</button>
              </div>
            </form>
          )}

          {activeProject ? (
            <div>
              <div style={{ marginBottom: 28, borderBottom: '1px solid #e2e8f0', paddingBottom: 20 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{activeProject.name}</h2>
                {activeProject.description && (
                  <p style={{ margin: 0, color: '#64748b', fontSize: 15, lineHeight: 1.5 }}>{activeProject.description}</p>
                )}
              </div>
              <TaskBoard projectId={activeProject.id} initialTasks={activeProject.tasks || []} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 100 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
              <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontWeight: 700 }}>Select a Project</h2>
              <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Choose a project from the sidebar list or spin up a new channel workspace.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── ENTRY ROOT WRAPPER ───────────────────────────────────────────────────────

function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 500, color: '#64748b', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8, animateSpin: 'spinning linear infinite 1s' }}>⚡</div>
        <div>Loading TaskFlow Workspace...</div>
      </div>
    </div>
  );
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}