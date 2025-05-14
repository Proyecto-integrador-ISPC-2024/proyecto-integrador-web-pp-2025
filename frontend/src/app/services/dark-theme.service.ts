import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkThemeService {
  constructor() {}

  // Método para obtener el tema guardado en localStorage
  getTheme(): string {
    return localStorage.getItem('theme') || 'light'; // Devuelve 'light' si no se encuentra tema guardado
  }

  // Método para guardar el tema en localStorage
  setTheme(theme: string): void {
    localStorage.setItem('theme', theme); // Guarda el tema seleccionado
  }

  // Método para aplicar el tema al body de la página
  applyTheme(): void {
    const theme = this.getTheme(); // Obtiene el tema guardado
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
       document.body.classList.remove('light-theme');
    } else {
       document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}
