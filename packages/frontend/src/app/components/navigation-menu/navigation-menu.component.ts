import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { environment } from 'src/environments/environment';
import {
  faQuestion,
  faHouse,
  faUser,
  faCompass,
  faPencil,
  faBell,
  faPowerOff,
  faServer,
  faExclamationTriangle,
  faBan,
  faEnvelope,
  faSearch,
  faUserEdit,
  faVolumeMute,
  faEyeSlash,
  faCode,
  faEuro,
  faSignOut,
  faBars,
  faUserLock,
  faCog,
  faChartSimple,
  faHourglass,
  faBellSlash,
  faIcons,
  faSkull
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';

import { MenuItem, Action } from 'src/app/interfaces';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss'],
})
export class NavigationMenuComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  maintenanceMode = environment.maintenance;
  menuVisible = false;
  notifications = 0;
  adminNotifications = 0;
  usersAwaitingAproval = 0;
  followsAwaitingAproval = 0;
  awaitingAsks = 0;
  privateMessagesNotifications = '';
  mobile = false;
  logo = environment.logo;
  defaultIcon = faQuestion;
  navigationSubscription: Subscription;
  loginSubscription: Subscription;
  scrollSubscription: Subscription;
  hamburguerIcon = faBars;
  pencilIcon = faPencil;
  currentRoute = '';
  constructor(
    private editorService: EditorService,
    private router: Router,
    public jwtService: JwtService,
    private loginService: LoginService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private dashboardService: DashboardService,
    private dialogService: MatDialog
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.loginSubscription = this.loginSubscription = this.loginService.loginEventEmitter.subscribe(
      () => {
        this.drawMenu();
      }
    );
    if (this.loginService.getForceClassicLogo()) {
      this.logo = '/assets/classicLogo.png'
    }
    this.navigationSubscription = this.router.events.subscribe((ev) => {
      scroll(0, 0)
      if (ev instanceof NavigationEnd) {
        this.currentRoute = ev.url;
        this.updateNotifications(ev.url);
      }
    });

    this.scrollSubscription = this.dashboardService.scrollEventEmitter.subscribe(() => {
      this.updateNotifications('scroll');
    });
  }

  ngOnInit(): void {
    this.drawMenu();
    this.onResize();
    this.menuVisible = !this.mobile;
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
    this.loginSubscription.unsubscribe();
    this.scrollSubscription.unsubscribe();
  }

  showMenu() {
    this.menuVisible = true;
  }

  hideMenu() {
    this.menuVisible = false;
    this.editorService.launchPostEditorEmitter.next({ action: Action.Close });
  }

  drawMenu() {
    this.menuItems = [
      {
        label: 'Log in',
        title: 'Log in',
        icon: faHouse,
        routerLink: '/login',
        visible: !this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Register',
        title: 'Register',
        icon: faUser,
        routerLink: '/',
        visible: !this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Explore without an account',
        icon: faCompass,
        title: 'See ALL the posts that are public! Yes, you can be a lurker',
        routerLink: '/dashboard/exploreLocal',
        visible: !this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Dashboard',
        title: 'View dashboard',
        icon: faHouse,
        routerLink: '/dashboard',
        visible: this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
      },

      {
        label: 'Write new woot',
        title: 'Write a woot',
        icon: faPencil,
        command: async () => {
          this.hideMenu();
          this.openEditor()
        },
        visible: this.jwtService.tokenValid(),
      },
      {
        label: 'Notifications',
        icon: faBell,
        title: 'Check your notifications',
        routerLink: '/dashboard/notifications',
        badge: this.notifications,
        visible: this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Explore',
        title: 'See the local posts of the server or the fediverse!',
        visible: this.jwtService.tokenValid(),
        icon: faCompass,
        items: [
          {
            label: 'Explore WAFRN',
            icon: faServer,
            title: 'See the local posts of the server!',
            routerLink: '/dashboard/exploreLocal',
            visible: this.jwtService.tokenValid(),
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'Explore the fediverse',
            icon: faCompass,
            title:
              'Take a look to all the public posts avaiable to us, not only of people in this servers',
            routerLink: '/dashboard/explore',
            visible: this.jwtService.tokenValid(),
            command: () => {
              this.hideMenu();
            },
          },
        ],
      },
      {
        label: 'Unanswered Asks',
        title: 'Unanswered Asks',
        badge: this.awaitingAsks,
        visible: this.jwtService.tokenValid(),
        command: () => this.hideMenu(),
        routerLink: '/profile/myAsks',
        icon: faQuestion
      },
      {
        label: 'Private messages',
        icon: faEnvelope,
        title: 'Private messages are here!',
        routerLink: '/dashboard/private',
        command: () => {
          this.hideMenu();
        },
        visible: this.jwtService.tokenValid(),
      },
      {
        label: 'Admin',
        icon: faPowerOff,
        title: 'Check your notifications',
        badge: this.adminNotifications + this.usersAwaitingAproval,
        visible: this.jwtService.adminToken(),
        items: [
          {
            label: 'Server list',
            icon: faServer,
            title: 'List of all the servers',
            routerLink: '/admin/server-list',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'Add emojis',
            icon: faIcons,
            title: 'Add emoji collection',
            routerLink: '/admin/emojis',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'User reports',
            title: 'User reports',
            icon: faExclamationTriangle,
            badge: this.adminNotifications,
            routerLink: '/admin/user-reports',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'User bans',
            title: 'User bans',
            icon: faBan,
            routerLink: '/admin/bans',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'User blocklists',
            title: 'User blocklists',
            icon: faHourglass,
            routerLink: '/admin/user-blocks',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'Stats',
            title: 'Stats',
            icon: faChartSimple,
            routerLink: '/admin/stats',
            command: () => {
              this.hideMenu();
            },
          },
          {
            label: 'Users awaiting aproval',
            title: 'User awaiting aproval',
            badge: this.usersAwaitingAproval,
            icon: faUserLock,
            routerLink: '/admin/activate-users',
            command: () => {
              this.hideMenu();
            },
          },
        ],
      },
      {
        label: 'Search',
        title: 'Search',
        icon: faSearch,
        visible: this.jwtService.tokenValid(),
        command: () => {
          this.hideMenu();
        },
        routerLink: '/dashboard/search',
      },
      {
        label: 'Settings',
        title: 'Your blog, your profile, blocks, and other stuff',
        visible: this.jwtService.tokenValid(),
        icon: faCog,
        badge: this.followsAwaitingAproval,
        items: [
          {
            label: 'Awaiting follows',
            title: 'awaiting follows',
            badge: this.followsAwaitingAproval,
            icon: faUser,
            command: () => this.hideMenu(),
            routerLink: '/blog/' + this.jwtService.getTokenData().url + '/followers'
          },
          {
            label: 'Edit profile',
            title: 'Edit profile',
            icon: faUserEdit,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/edit',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Edit my theme',
            title: 'Edit my theme',
            icon: faUserEdit,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/css',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage muted users',
            title: 'Manage muted users',
            icon: faVolumeMute,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/mutes',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage muted posts',
            title: 'Manage muted posts',
            icon: faBellSlash,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/silencedPosts',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage blocked users',
            title: 'Manage blocked users',
            icon: faBan,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/blocks',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage blocked servers',
            title: 'Manage blocked servers',
            icon: faServer,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/serverBlocks',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Import follows',
            title: 'Import follows',
            icon: faUserEdit,
            command: () => {
              this.hideMenu();
            },
            routerLink: '/profile/importFollows',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Special secret menu',
            title: 'Special secret menu',
            icon: faSkull,
            visible: this.jwtService.tokenValid(),
            command: () => {
              this.hideMenu();
            },
            routerLink: '/doom',
          },
        ],
      },
      {
        label: 'My blog',
        title: 'View your own blog',
        icon: faUser,
        command: () => {
          this.hideMenu();
        },
        routerLink:
          '/blog/' +
          (this.jwtService.tokenValid()
            ? this.jwtService.getTokenData()['url']
            : ''),
        visible: this.jwtService.tokenValid(),
      },
      {
        label: '',
        title: '',
        divider: true,
      },
      {
        label: 'Privacy policy & rules',
        title: 'Privacy policy & rules',
        icon: faEyeSlash,
        routerLink: '/privacy',
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Check the source code!',
        icon: faCode,
        title: 'The frontend is made in angular, and the backend in typescript. you can check the code here',
        url: 'https://github.com/gabboman/wafrn',
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Patreon',
        title: 'Give us some money through patreon',
        icon: faEuro,
        url: 'https://patreon.com/wafrn',
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Ko-fi',
        title: 'Give us some money through ko-fi',
        icon: faEuro,
        url: 'https://ko-fi.com/wafrn',
        command: () => {
          this.hideMenu();
        },
      },
      {
        label: 'Log out',
        icon: faSignOut,
        title:
          'nintendo this button is for you, and your 25000000 alt accounts',
        command: () => {
          this.loginService.logOut();
          this.hideMenu();
        },
        visible: this.jwtService.tokenValid(),
      },
    ];
  }

  async updateNotifications(url: string) {
    if (this.jwtService.tokenValid()) {
      if (url === '/dashboard/notifications') {
        this.notifications = 0;
      } else {
        const response =
          await this.notificationsService.getUnseenNotifications();
        this.notifications = response.notifications;
        this.adminNotifications = response.reports;
        this.usersAwaitingAproval = response.usersAwaitingAproval;
        this.followsAwaitingAproval = response.followsAwaitingAproval
        this.awaitingAsks = response.asks;
      }
      this.drawMenu();
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.mobile = window.innerWidth <= 992;
  }

  async openEditor() {
    this.editorService.openDialogWithData(undefined);
  }

  onCloseMenu() {
    this.menuVisible = false;
  }
}
