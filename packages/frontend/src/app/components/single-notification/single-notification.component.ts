import { Component, Input, OnInit } from '@angular/core';
import { NotificationType } from 'src/app/enums/notification-type';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { environment } from 'src/environments/environment';
import { MatButton } from '@angular/material/button';
// todo interfaces import
import{
PostHeaderComponent ,
PostFragmentComponent ,
AvatarSmallComponent 
} from 'src/app/components';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    PostFragmentComponent,
    MatButton,
    PostHeaderComponent,
    AvatarSmallComponent
],
})
export class SingleNotificationComponent implements OnInit {
  emojiUrl: string = '';
  @Input() notification!: UserNotifications;
  notificationType = NotificationType;

  ngOnInit(): void {
    if (this.notification.emojiReact) {
      this.emojiUrl =
        environment.externalCacheurl +
        encodeURIComponent(this.notification.emojiReact?.url as string);
    }


  }
}
