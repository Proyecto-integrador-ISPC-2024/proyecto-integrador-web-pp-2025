import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userRole: string = '';

  constructor(private adminService: AdminService, private authService: AuthService) {}

  ngOnInit(): void {
    this.getUserRole();
  }

  getUserRole(): void {
    this.userRole = this.authService.getUserRole();
  }

  isAdmin(): boolean {
    return this.adminService.isAdmin();
  }

  isClient(): boolean {
    return this.userRole === 'CLIENTE';
  }
}
