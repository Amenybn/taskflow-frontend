import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Activity, Dashboard, Member, MemberRequest, Project, ProjectRequest, ProjectStatus,
  SystemInfo, Task, TaskRequest, TaskStatus,
} from './models';

const API = '/api';

function params(filters: Record<string, string | number | null | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Tableau de bord & système
  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API}/dashboard`);
  }

  activities(limit = 30): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${API}/activities`, { params: params({ limit }) });
  }

  system(): Observable<SystemInfo> {
    return this.http.get<SystemInfo>(`${API}/system`);
  }

  // Projets
  projects(filters: { status?: ProjectStatus | null; q?: string } = {}): Observable<Project[]> {
    return this.http.get<Project[]>(`${API}/projects`, { params: params(filters) });
  }

  project(id: number): Observable<Project> {
    return this.http.get<Project>(`${API}/projects/${id}`);
  }

  createProject(body: ProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${API}/projects`, body);
  }

  updateProject(id: number, body: ProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${API}/projects/${id}`, body);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/projects/${id}`);
  }

  // Tâches
  tasks(filters: { projectId?: number | null; assigneeId?: number | null } = {}): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks`, { params: params(filters) });
  }

  createTask(body: TaskRequest): Observable<Task> {
    return this.http.post<Task>(`${API}/tasks`, body);
  }

  updateTask(id: number, body: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${API}/tasks/${id}`, body);
  }

  updateTaskStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${API}/tasks/${id}/status`, { status });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/tasks/${id}`);
  }

  // Équipe
  members(): Observable<Member[]> {
    return this.http.get<Member[]>(`${API}/members`);
  }

  createMember(body: MemberRequest): Observable<Member> {
    return this.http.post<Member>(`${API}/members`, body);
  }

  updateMember(id: number, body: MemberRequest): Observable<Member> {
    return this.http.put<Member>(`${API}/members/${id}`, body);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/members/${id}`);
  }
}
