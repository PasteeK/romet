import { Component } from '@angular/core';
import { ButtonMenu } from "../../shared/button-menu/button-menu";
import { Logo } from "../../shared/logo/logo";

@Component({
  selector: 'app-title-menu',
  imports: [ButtonMenu, Logo],
  templateUrl: './title-menu.html',
  styleUrl: './title-menu.css'
})
export class TitleMenu {
  hasSave: boolean = false;
}
