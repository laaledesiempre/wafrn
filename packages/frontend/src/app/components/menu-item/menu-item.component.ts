import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { MatBadgeModule } from '@angular/material/badge';

import { MenuItem } from 'src/app/interfaces';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss'
})
export class MenuItemComponent {

  chevronUp = faChevronUp;
  chevronDown = faChevronDown;

  @Input() item!: MenuItem;
  expanded = false;

  constructor(private router: Router) {
  }

  doCommand() {
    // TODO href and routerlink in the same page, a way of not doing it this dirty way
    // this is BAD for accesibility you know
    // the other option was an ngif and displaying it depending on this. not cool!
    if (this.item.url) {
      window.open(this.item.url, '_blank');
    }
    if (this.item.routerLink) {
      this.router.navigate([this.item.routerLink])
      console.log('navigationg to... ' + this.item.routerLink)
    }
    if (this.item.command) {
      this.item.command();
    }
  }

}
