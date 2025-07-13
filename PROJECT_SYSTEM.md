# Project Management System

This implementation adds Claude-like project functionality to the chat application, allowing users to organize their work with project-specific knowledge, custom instructions, and separate chat histories.

## Features

### 1. Project Management
- **Create Projects**: Users can create new projects with names, descriptions, and custom instructions
- **Project Selection**: Easy switching between projects using a dropdown selector
- **Project Context**: All chats and knowledge are organized by project

### 2. Knowledge Base
- **File Upload**: Upload documents (PDF, DOC, TXT, MD) to projects
- **Content Processing**: Files are processed and their content is stored for AI context
- **Knowledge Integration**: File content is automatically included in AI conversations
- **File Management**: View and delete uploaded files

### 3. Custom Instructions
- **Project-Specific Prompts**: Set custom instructions that are automatically included in AI conversations
- **Contextual Behavior**: AI responses are tailored to project-specific requirements
- **Persistent Settings**: Instructions are saved and applied to all chats within a project

### 4. Organized Chat History
- **Project-Filtered Chats**: Sidebar shows only chats for the current project
- **Separate Histories**: Each project maintains its own chat history
- **Cross-Project Organization**: Switch between projects to access different conversation contexts

## Implementation Overview

### Database Schema
```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  custom_instructions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge base table
CREATE TABLE knowledge_base (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Updated chats table
ALTER TABLE chats ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
```

### Key Components

#### ProjectManager
- Dropdown for project selection
- Project creation dialog
- Integration with user authentication

#### KnowledgeBase
- File upload interface
- File listing and management
- Content processing and storage

#### ProjectOverviewWidget
- Visual display of project information
- Knowledge file count
- Custom instructions preview

### API Endpoints

#### `/api/projects`
- `GET`: Fetch user's projects
- `POST`: Create new project

#### `/api/knowledge`
- `GET`: Fetch project knowledge files
- `POST`: Upload new files

#### `/api/knowledge/[id]`
- `DELETE`: Remove knowledge file

### Integration Points

#### Chat API Updates
- Project context included in AI system prompt
- Knowledge content automatically added to conversations
- Custom instructions applied to all project chats

#### Chat Storage
- Chats are associated with projects
- Project filtering in chat retrieval
- Sidebar shows project-specific chat history

## Usage Guide

1. **Create a Project**
   - Click the "+" button next to the project selector
   - Enter project name, description, and custom instructions
   - Click "Create Project"

2. **Upload Knowledge**
   - Select a project
   - Click "Show Knowledge" to expand the knowledge panel
   - Use "Upload Files" to add documents
   - Uploaded content is automatically included in AI conversations

3. **Set Custom Instructions**
   - Include project-specific behavior instructions when creating projects
   - Instructions are automatically applied to all AI responses in that project

4. **Organize Chats**
   - Switch between projects to see different chat histories
   - Each project maintains separate conversation threads
   - New chats are automatically associated with the current project

## Benefits

- **Better Organization**: Separate contexts for different work areas
- **Enhanced AI Responses**: Project-specific knowledge and instructions improve relevance
- **Improved Workflow**: Easy switching between different project contexts
- **Knowledge Persistence**: Uploaded documents remain available across sessions
- **Contextual Memory**: AI maintains project-specific understanding

This implementation provides a professional-grade project management system similar to Claude Projects, enabling users to maintain organized, context-aware conversations across different work domains.
