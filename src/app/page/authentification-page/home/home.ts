import { Component } from '@angular/core';
import { Logo } from "../../../shared/logo/logo";
import { ButtonMenu } from "../../../shared/button-menu/button-menu";

@Component({
  selector: 'app-home',
  imports: [ Logo, ButtonMenu],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
