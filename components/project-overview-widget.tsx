"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, Settings } from "lucide-react";
import { type Project, type KnowledgeBase } from "@/lib/db/schema";

interface ProjectOverviewWidgetProps {
  project: Project | null;
  knowledge: KnowledgeBase[];
}

export function ProjectOverviewWidget({ project, knowledge }: ProjectOverviewWidgetProps) {
  if (!project) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
            <p>No project selected</p>
            <p className="text-sm">Create or select a project to organize your chats and knowledge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5" />
          {project.name}
          {project.isDefault && <Badge variant="secondary">Default</Badge>}
        </CardTitle>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {project.customInstructions && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Settings className="h-4 w-4" />
                Custom Instructions
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                {project.customInstructions}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Knowledge Files
            </div>
            <Badge variant="outline">
              {knowledge.length} {knowledge.length === 1 ? 'file' : 'files'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
