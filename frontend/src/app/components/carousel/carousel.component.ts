import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent {
  constructor(private router: Router) {}

  irAProductos() {
    const modal = document.querySelector('.modal.show') as HTMLElement;
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal)?.hide();
    }
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    this.router.navigate(['/products']);
  }
}
