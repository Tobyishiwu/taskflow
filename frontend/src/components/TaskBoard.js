import React, { useState } from 'react';
import { tasks as tasksApi } from '../api';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#6c757d' },
  { key: 'in_progress', label: 'In Progress', color: '#0d6efd' },
  { key: 'done', label: 'Done', color: '#198754' },
];

const PRIORITY_COLORS = { high: '#dc3545', medium: '#fd7e14', low: '#6c757d' };

function TaskCard({ task, onUpdate, onDelete }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 10,
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
        cursor: 'grab',
        opacity: dragging ? 0.5 : 1,
        transition: 'box-shadow 0.2s, opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1a2e', flex: 1 }}>{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: '0 0 0 8px' }}
        >×</button>
      </div>
      {task.description && (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666', lineHeight: 1.4 }}>{task.description}</p>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, background: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority], padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
          {task.priority}
        </span>
        {task.due_date && (
          <span style={{ fontSize: 11, color: '#888', padding: '2px 0' }}>📅 {task.due_date}</span>
        )}
      </div>
    </div>
  );
}

function Column({ column, tasks, onDrop, onDelete, onAddTask }) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(e, column.key); }}
      style={{
        flex: 1,
        minWidth: 260,
        background: over ? '#f0f4ff' : '#f8f9fa',
        borderRadius: 12,
        padding: '14px 12px',
        border: `2px dashed ${over ? column.color : 'transparent'}`,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: column.color }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {column.label}
          </span>
          <span style={{ fontSize: 12, background: '#e9ecef', color: '#666', borderRadius: 10, padding: '1px 7px' }}>
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(column.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: column.color, lineHeight: 1 }}>+</button>
      </div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onDelete={onDelete} />
      ))}
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0' }}>Drop tasks here</div>
      )}
    </div>
  );
}

export default function TaskBoard({ projectId, initialTasks = [], onTasksChange }) {
  const [taskList, setTaskList] = useState(initialTasks);
  const [showForm, setShowForm] = useState(null); // column key
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [error, setError] = useState('');

  const handleDrop = async (e, newStatus) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    try {
      await tasksApi.update(taskId, { status: newStatus });
      const updated = taskList.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setTaskList(updated);
      onTasksChange?.(updated);
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      const updated = taskList.filter(t => t.id !== taskId);
      setTaskList(updated);
      onTasksChange?.(updated);
    } catch {
      setError('Failed to delete task.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const created = await tasksApi.create({
        ...newTask,
        status: showForm,
        project: projectId,
        due_date: newTask.due_date || null,
      });
      const updated = [created, ...taskList];
      setTaskList(updated);
      onTasksChange?.(updated);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowForm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#fff5f5', color: '#dc3545', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
          {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Add Task Form */}
      {showForm && (
        <form onSubmit={handleAddTask} style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>New Task in "{COLUMNS.find(c => c.key === showForm)?.label}"</h4>
          <input required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Task title *" style={inputStyle} />
          <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={btnStyle('#0d6efd')}>Add Task</button>
            <button type="button" onClick={() => setShowForm(null)} style={btnStyle('#6c757d')}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map(col => (
          <Column
            key={col.key}
            column={col}
            tasks={taskList.filter(t => t.status === col.key)}
            onDrop={handleDrop}
            onDelete={handleDelete}
            onAddTask={(colKey) => setShowForm(colKey)}
          />
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', marginBottom: 10, border: '1px solid #dee2e6',
  borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit',
};

const btnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none', padding: '8px 18px',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
});
