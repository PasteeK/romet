import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-button-menu',
  imports: [CommonModule],
  templateUrl: './button-menu.html',
  styleUrl: './button-menu.css'
})
export class ButtonMenu {
  @Input() buttonText: string = 'Button';
  @Input() route: string | null = null;
  @Input() isDisabled: boolean = false;
  @Input() newGame: boolean = false;   // ⬅️ ajouté
  @Output() clicked = new EventEmitter<void>();

  constructor(private router: Router) {}

  handleClick() {
    if (this.isDisabled) return;

    if (this.route) {
      if (this.newGame) {
        sessionStorage.setItem('romet.forceNew.once.v1', '1');
      } else {
        sessionStorage.removeItem('romet.forceNew.once.v1');
      }

      this.router.navigate([this.route], { replaceUrl: this.newGame });
    } else {
      this.clicked.emit();
    }
  }
}
