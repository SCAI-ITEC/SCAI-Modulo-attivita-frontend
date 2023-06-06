import { Component, QueryList, ViewChildren } from '@angular/core';
import { RouterLinkActive } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { SidebarService } from 'src/app/services/sidebar.service';
import { MiscDataService } from '../../features/commons/services/miscellaneous-data.service';
import { intersection } from 'src/app/utils/array';
import { ROLES } from 'src/app/models/user';

interface SidebarSubitem {
  title: string;
  path: string;
  icon?: string;
  roles?: string[];
}

interface SidebarItem {
  isActive: boolean; // Make the collapse work
  title: string;
  path?: string;
  icon?: string;
  children?: SidebarSubitem[];
  roles?: string[];
}

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class DashboardSidebarComponent {

  // Get all view children with #rla applied
  @ViewChildren('rla')
  rlaList!: QueryList<RouterLinkActive>;
  
  intersection = intersection;

  sidebarItems: SidebarItem[] = [
    {
      isActive: false,
      title: 'Attività',
      icon: 'bi bi-list-task',
      path: '/attivita',
      roles: [ ROLES.SEGRETERIA ]
    },
    {
      isActive: false,
      title: 'Diarie',
      icon: 'bi bi-briefcase',
      children: [
        {
          path: "/diarie-azienda/creazione-tipo-trasferta",
          title: "Creazione tipo trasferta"
        },
        {
          path: "/diarie-azienda/abilitazione-diaria-azienda",
          title: "Abilitazione diaria azienda",
          roles: [ ROLES.SEGRETERIA ]
        }
      ]
    },
    {
      isActive: false,
      title: 'Stato Avanzamento',
      icon: 'bi bi-bar-chart-line-fill',
      path: '/stato-avanzamento',
    }
  ];

  username$: Observable<string | undefined>; 

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    public miscData: MiscDataService
  ) {
    this.username$ = this.authService.user$.pipe(map(user => user.cognome + ' ' + user.nome));
  }

  ngAfterViewInit(): void {

    if (!this.rlaList) return;

    // Wait for the router to activate
    setTimeout(() => {

      // Look for the currently activated route
      const activeItemIndex = this.rlaList.toArray()
        .findIndex(x => x.isActive);

      // If there's and active item, then expand it
      if (activeItemIndex > -1)
        this.sidebarItems[activeItemIndex].isActive = true;
    }, 150);
  }
}
