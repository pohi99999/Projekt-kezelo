export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  priority: 'alacsony' | 'közepes' | 'magas';
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SuggestedTask {
  projectId: string;
  title: string;
  dueDateDaysOffset: number;
}
