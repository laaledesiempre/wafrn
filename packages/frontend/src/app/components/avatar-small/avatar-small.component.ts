import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
//todo angular imports interfaces imports
import { SimplifiedUser } from 'src/app/interfaces';

@Component({
  selector: 'app-avatar-small',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './avatar-small.component.html',
  styleUrl: './avatar-small.component.scss'
})
export class AvatarSmallComponent implements OnInit {
  @Input() user!: SimplifiedUser;
  @Input() disabled = false;
  avatar: string = ''


  ngOnInit(): void {
    this.avatar = environment.externalCacheurl + encodeURIComponent(
      this.user.url.startsWith('@') ?
        this.user.avatar :
        environment.baseMediaUrl + this.user.avatar
    ) + '&avatar=true'
  }



}
