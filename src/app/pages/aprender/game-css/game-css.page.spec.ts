import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCSSPage } from './game-css.page';

describe('GameCSSPage', () => {
  let component: GameCSSPage;
  let fixture: ComponentFixture<GameCSSPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GameCSSPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
