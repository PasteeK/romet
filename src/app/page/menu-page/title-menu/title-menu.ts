import { Component } from '@angular/core';
import { ButtonMenu } from '../../../shared/button-menu/button-menu';
import { Logo } from '../../../shared/logo/logo';
import { Profil } from "../../../features/profil/profil";

@Component({
  selector: 'app-title-menu',
  imports: [ButtonMenu, Logo, Profil],
  templateUrl: './title-menu.html',
  styleUrl: './title-menu.css'
})
export class TitleMenu {
  hasSave: boolean = false;

  showProfil: boolean = false;
}
