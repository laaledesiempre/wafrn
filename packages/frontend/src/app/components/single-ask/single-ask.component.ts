import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Ask } from 'src/app/interfaces/ask';

import {
  AvatarSmallComponent 
} from 'src/app/components';

@Component({
  selector: 'app-single-ask',
  standalone: true,
  imports: [
    CommonModule,
    AvatarSmallComponent,

  ],
  templateUrl: './single-ask.component.html',
  styleUrl: './single-ask.component.scss'
})
export class SingleAskComponent {

  @Input() ask!: Ask

}
