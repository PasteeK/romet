import { CommonModule } from "@angular/common";
import { Component, EventEmitter, input, Input, Output } from '@angular/core';

@Component({
  selector: 'app-profil',
  imports: [CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil {
  @Input() visible: boolean = false;
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  @Input() username: string = "";

  
  close() {
    this.closed.emit();
  }
}
