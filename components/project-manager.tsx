"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderOpen, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { type Project } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectManagerProps {
  currentProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  userId: string;
}

export function ProjectManager({ currentProject, onProjectChange, userId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    customInstructions: ''
  });
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        
        // Set default project if none selected
        if (!currentProject && data.length > 0) {
          const defaultProject = data.find((p: Project) => p.isDefault) || data[0];
          onProjectChange(defaultProject);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          userId,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        setProjects(prev => [...prev, project]);
        onProjectChange(project);
        setIsCreateDialogOpen(false);
        setNewProject({ name: '', description: '', customInstructions: '' });
        toast.success('Project created successfully');
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description || '',
      customInstructions: project.customInstructions || ''
    });
    setIsEditDialogOpen(true);
  };

  const updateProject = async () => {
    if (!editingProject || !newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          userId,
        }),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        
        // Update current project if it's the one being edited
        if (currentProject?.id === updatedProject.id) {
          onProjectChange(updatedProject);
        }
        
        setIsEditDialogOpen(false);
        setEditingProject(null);
        setNewProject({ name: '', description: '', customInstructions: '' });
        toast.success('Project updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (project: Project) => {
    if (project.isDefault) {
      toast.error('Cannot delete default project');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        
        // If we're deleting the current project, switch to the first available project
        if (currentProject?.id === project.id) {
          const remainingProjects = projects.filter(p => p.id !== project.id);
          onProjectChange(remainingProjects.length > 0 ? remainingProjects[0] : null);
        }
        
        toast.success('Project deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentProject?.id || ""}
        onValueChange={(value) => {
          const project = projects.find(p => p.id === value);
          onProjectChange(project || null);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select project">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              {currentProject?.name || "No project"}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description (optional)"
              />
            </div>
            <div>
              <Label htmlFor="instructions">Custom Instructions</Label>
              <Textarea
                id="instructions"
                value={newProject.customInstructions}
                onChange={(e) => setNewProject(prev => ({ ...prev, customInstructions: e.target.value }))}
                placeholder="Custom instructions for this project (optional)"
                rows={4}
              />
            </div>
            <Button onClick={createProject} disabled={!newProject.name.trim()}>
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!currentProject}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit-instructions">Custom Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={newProject.customInstructions}
                onChange={(e) => setNewProject(prev => ({ ...prev, customInstructions: e.target.value }))}
                placeholder="Custom instructions for this project (optional)"
                rows={4}
              />
            </div>
            <Button onClick={updateProject} disabled={!newProject.name.trim()}>
              Update Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={() => projectToDelete && deleteProject(projectToDelete)}
        disabled={!projectToDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {projects.map(project => (
            <DropdownMenuItem key={project.id} onClick={() => editProject(project)}>
              Edit
            </DropdownMenuItem>
          ))}
          {projectToDelete && (
            <DropdownMenuItem onClick={() => deleteProject(projectToDelete)}>
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
