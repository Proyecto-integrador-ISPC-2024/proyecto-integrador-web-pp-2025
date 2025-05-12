import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';

describe('DarkThemeComponent', () => {
  let component: DarkThemeComponent;
  let fixture: ComponentFixture<DarkThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarkThemeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DarkThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
