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
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { type Project } from "@/lib/db/schema";

interface ProjectManagerProps {
  currentProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  userId: string;
}

export function ProjectManager({ currentProject, onProjectChange, userId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    customInstructions: ''
  });

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
    </div>
  );
}
