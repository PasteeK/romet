import { Component, OnInit } from '@angular/core';
import { ButtonMenu } from '../../../shared/button-menu/button-menu';
import { Logo } from '../../../shared/logo/logo';
import { Profil } from "../../../features/profil/profil";
import { AuthService } from '../../authentification-page/services/auth-service';
import { SavegameService } from '../../../services/savegame.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-title-menu',
  standalone: true,
  imports: [ButtonMenu, Logo, Profil],
  templateUrl: './title-menu.html',
  styleUrl: './title-menu.css'
})
export class TitleMenu implements OnInit {
  username: string | null = null;
  hasSave: boolean = false;
  showProfil: boolean = false;

  constructor(
  private authService: AuthService,
  private saveSvc: SavegameService,
  private router: Router
) {}

  async ngOnInit(): Promise<void> {
    this.username = localStorage.getItem('username');
    try {
      const save = await this.saveSvc.getCurrent();
      this.hasSave = !!save;
    } catch {
      this.hasSave = false;
    }
  }

  startNewGame() {
    sessionStorage.setItem('romet.forceNew.once.v1', '1');
    this.router.navigate(['/map']);
  }

  continueGame() {
    sessionStorage.removeItem('romet.forceNew.once.v1');
    this.router.navigate(['/map']);
  }
}