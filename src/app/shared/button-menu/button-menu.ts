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
  @Output() clicked = new EventEmitter<void>();
  @Input() isDisabled: boolean = false;

  constructor(private router: Router) {}
  handleClick() {
    if (this.isDisabled) {
      return;
    } else if (this.route) {
      this.router.navigate([this.route]);
    } else {
      this.clicked.emit();
    }
  }
}
