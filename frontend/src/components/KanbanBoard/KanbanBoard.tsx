import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Task, Column } from '../../types';
import { tasksApi } from '../../services/api';
import TaskCard from './TaskCard';
import SortableColumn from './SortableColumn';

interface KanbanBoardProps {
  projectId: number;
  columns: Column[];
  tasks: Task[];
  onTasksChange: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  columns,
  tasks,
  onTasksChange,
}) => {
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tasks.find((t) => t.task_id === active.id);
    const overTask = tasks.find((t) => t.task_id === over.id);
    
    if (!activeTask || !overTask) return;
    
    if (activeTask.column_id === overTask.column_id) {
      // Reordering within same column
      const columnTasks = tasks
        .filter((t) => t.column_id === activeTask.column_id)
        .sort((a, b) => a.order_index_task - b.order_index_task);
      
      const oldIndex = columnTasks.findIndex((t) => t.task_id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.task_id === over.id);
      
      const newOrder = arrayMove(columnTasks, oldIndex, newIndex);
      
      // Update order in database
      for (let i = 0; i < newOrder.length; i++) {
        await tasksApi.updateTask(newOrder[i].task_id, {
          order_index_task: i,
        });
      }
    } else {
      // Moving to different column
      await tasksApi.moveTask(
        activeTask.task_id,
        overTask.column_id,
        overTask.order_index_task
      );
    }
    
    onTasksChange();
  };

  const handleCreateTask = async () => {
    if (!selectedColumn || !newTaskTitle.trim()) return;
    
    await tasksApi.createTask({
      project_id: projectId,
      column_id: selectedColumn,
      title: newTaskTitle,
    });
    
    setNewTaskTitle('');
    setOpenTaskDialog(false);
    onTasksChange();
  };

  const handleFullscreenFocus = (taskId: number) => {
    // Open task in fullscreen mode
    const task = tasks.find(t => t.task_id === taskId);
    if (task) {
      // You can implement a fullscreen modal or route
      console.log('Focus on task:', task);
    }
  };

  return (
    <Box sx={{ height: '100%', overflowX: 'auto', p: 2 }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
          {columns.map((column) => {
            const columnTasks = tasks
              .filter((t) => t.column_id === column.column_id)
              .sort((a, b) => a.order_index_task - b.order_index_task);
            
            return (
              <SortableColumn
                key={column.column_id}
                column={column}
                tasks={columnTasks}
                onAddTask={() => {
                  setSelectedColumn(column.column_id);
                  setOpenTaskDialog(true);
                }}
                onTaskClick={handleFullscreenFocus}
              />
            );
          })}
        </Box>
      </DndContext>

      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            variant="outlined"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} variant="contained">
              Create
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;