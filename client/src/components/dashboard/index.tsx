import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchTasks,
  addTask,
  updateTask,
  deleteTask,
} from "@/store/thunks/tasks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  PlusCircle,
  Calendar,
  User,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Task, TaskStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
const statusStyles = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  IN_PROGRESS: "bg-sky-100 text-sky-800 border-sky-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const TaskRow: React.FC<{
  task: Task;
  onUpdateStatus: (task: Task) => void;
  onDelete: (id: string) => void;
}> = ({ task, onUpdateStatus, onDelete }) => (
  <TableRow>
    <TableCell className="font-medium">{task.title}</TableCell>
    <TableCell>
      <Select
        value={task.status}
        onValueChange={(value: TaskStatus) =>
          onUpdateStatus({ ...task, status: value })
        }
      >
        <SelectTrigger className={`${statusStyles[task.status]} w-[140px]`}>
          {task.status}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell>
      <div className="flex items-center">
        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
        {format(new Date(task.dueDate), "MMM d, yyyy")}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center">
        <User className="mr-2 h-4 w-4 text-gray-500" />
        {task.assignedTo}
      </div>
    </TableCell>
    <TableCell>
      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </TableCell>
  </TableRow>
);

const SkeletonRow: React.FC = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-[250px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[120px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[150px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[40px]" />
    </TableCell>
  </TableRow>
);

const AddTaskDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id">) => void;
}> = ({ isOpen, onClose, onAddTask }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Task</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          onAddTask({
            title: formData.get("title") as string,
            status: formData.get("status") as TaskStatus,
            dueDate: formData.get("dueDate") as string,
            assignedTo: formData.get("assignedTo") as string,
            description: formData.get("description") as string,
          });
        }}
      >
        <div className="grid gap-4 py-4">
          <Input name="title" placeholder="Task Title" required />
          <Textarea name="description" placeholder="Task Description" />
          <Select name="status">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Input name="dueDate" type="date" />
          <Input name="assignedTo" placeholder="Assigned To" />
        </div>
        <DialogFooter>
          <Button type="submit">Add Task</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading } = useSelector(
    (state: RootState) => state.tasks
  );
  const { user } = useAuth();
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleAddTask = async (newTask: Omit<Task, "id">) => {
    if (user && user?.role !== "admin") {
      toast({
        variant: "destructive",
        description: "Only Admin have access to delete tasks",
      });
      return;
    }
    toast({ variant: "default", description: "Task Adding..." });
    const response = await dispatch(addTask(newTask));
    if (response && "error" in response) {
      toast({ variant: "destructive", description: response.error.message });
      return;
    }
    setIsAddTaskDialogOpen(false);
    toast({ variant: "default", description: "Task Successfully Added" });
  };

  const handleUpdateTaskStatus = async (task: Task) => {
    toast({ variant: "default", description: "Task updating..." });
    const response = await dispatch(updateTask(task));
    if (response && "error" in response) {
      toast({ variant: "destructive", description: response.error.message });
      return;
    }
    toast({ variant: "default", description: "Task Successfully Updated" });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (user && user?.role !== "admin") {
      toast({
        variant: "destructive",
        description: "Only Admin have access to delete tasks",
      });
      return;
    }
    toast({ variant: "default", description: "Task deleting..." });

    const response = await dispatch(deleteTask(taskId));
    if (response && "error" in response) {
      toast({ variant: "destructive", description: response.error.message });
      return;
    }
    toast({ variant: "default", description: "Task Successfully Deleted" });
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Task Management</CardTitle>
        {user?.role === "admin" && (
          <>
            <Button
              onClick={() => setIsAddTaskDialogOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Task
            </Button>
            <AddTaskDialog
              isOpen={isAddTaskDialogOpen}
              onClose={() => setIsAddTaskDialogOpen(false)}
              onAddTask={handleAddTask}
            />
          </>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
