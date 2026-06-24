import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Add this
import { NotificationService } from '../../core/services/notification.service';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-notification-bell',
  standalone: true, // You likely have this set to true
    imports: [CommonModule, MaterialModules],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  notifications: any[] = [];
  showDropdown = false;

  constructor(private navService: NotificationService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.navService.getMyNotifications().subscribe(data => {
      this.notifications = data.filter(n => !n.isRead);
    });
  }

  toggle() {
    this.showDropdown = !this.showDropdown;
  }

  dismiss(id: number) {
    this.navService.markAsRead(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.notificationId !== id);
    });
  }
}
