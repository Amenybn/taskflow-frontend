import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { ProjectDetailComponent } from './pages/project-detail.component';
import { ProjectsComponent } from './pages/projects.component';
import { SystemComponent } from './pages/system.component';
import { TasksComponent } from './pages/tasks.component';
import { TeamComponent } from './pages/team.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent, title: 'Tableau de bord · TaskFlow' },
  { path: 'projects', component: ProjectsComponent, title: 'Projets · TaskFlow' },
  { path: 'projects/:id', component: ProjectDetailComponent, title: 'Projet · TaskFlow' },
  { path: 'tasks', component: TasksComponent, title: 'Tâches · TaskFlow' },
  { path: 'team', component: TeamComponent, title: 'Équipe · TaskFlow' },
  { path: 'system', component: SystemComponent, title: 'Persistance · TaskFlow' },
  { path: '**', redirectTo: 'dashboard' },
];
