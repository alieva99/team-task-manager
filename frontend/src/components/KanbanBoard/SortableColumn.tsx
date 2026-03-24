import React from 'react';

interface SortableColumnProps {
  column: any;
  tasks: any[];
  onAddTask: () => void;
  onTaskClick: (id: number) => void;
}

const SortableColumn: React.FC<SortableColumnProps> = ({ 
  column, 
  tasks, 
  onAddTask, 
  onTaskClick 
}) => {
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '15px', 
      margin: '10px',
      minWidth: '250px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>{column.column_name}</h2>
      <button onClick={onAddTask}>+ Add Task</button>
      {tasks.map(task => (
        <div 
          key={task.task_id} 
          onClick={() => onTaskClick(task.task_id)}
          style={{ 
            cursor: 'pointer',
            padding: '8px',
            margin: '5px 0',
            backgroundColor: 'white',
            border: '1px solid #eee'
          }}
        >
          {task.title}
        </div>
      ))}
    </div>
  );
};

export default SortableColumn;