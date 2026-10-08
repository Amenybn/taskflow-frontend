export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'SYSTEM';

export interface Member {
  id: number;
  fullName: string;
  email: string;
  role: string | null;
  avatarColor: string;
  createdAt: string;
  taskCount: number;
  openTaskCount: number;
  doneTaskCount: number;
}

export interface MemberRequest {
  fullName: string;
  email: string;
  role: string | null;
  avatarColor: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  color: string;
  budget: number | null;
  ownerId: number | null;
  ownerName: string | null;
  ownerColor: string | null;
  taskCount: number;
  doneCount: number;
  progress: number;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  name: string;
  code: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  color: string;
  budget: number | null;
  ownerId: number | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  estimatedHours: number | null;
  projectId: number;
  projectName: string;
  projectCode: string;
  projectColor: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeColor: string | null;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TaskRequest {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  estimatedHours: number | null;
  projectId: number | null;
  assigneeId: number | null;
}

export interface Activity {
  id: number;
  type: ActivityType;
  entityType: string;
  entityId: number | null;
  message: string;
  createdAt: string;
}

export interface Workload {
  memberId: number;
  fullName: string;
  role: string | null;
  avatarColor: string;
  openTasks: number;
  doneTasks: number;
}

export interface Dashboard {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
  completionRate: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<Priority, number>;
  projectsByStatus: Record<ProjectStatus, number>;
  projects: Project[];
  workload: Workload[];
  upcomingTasks: Task[];
  recentActivity: Activity[];
}

export interface ServerBoot {
  id: number;
  bootedAt: string;
  hostname: string;
  databaseProduct: string;
}

export interface SystemInfo {
  appVersion: string;
  javaVersion: string;
  hostname: string;
  databaseProduct: string;
  databaseVersion: string;
  jdbcUrl: string;
  storage: string;
  persistent: boolean;
  startedAt: string;
  uptimeSeconds: number;
  bootCount: number;
  firstBootAt: string;
  recentBoots: ServerBoot[];
  records: Record<string, number>;
}
