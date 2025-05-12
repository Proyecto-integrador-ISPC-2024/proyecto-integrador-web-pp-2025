import { Component } from '@angular/core';

@Component({
  selector: 'app-dark-theme',
  standalone: true,
  imports: [],
  templateUrl: './dark-theme.component.html',
  styleUrl: './dark-theme.component.css'
})
export class DarkThemeComponent {
  isDarkMode=false;

  toggleTheme(event:Event):void{
    this.isDarkMode=!this.isDarkMode;

    if(this.isDarkMode){
      document.body.classList.add('dark-theme');
    }else{
      document.body.classList.remove('dark-theme');
    }
  }
}
