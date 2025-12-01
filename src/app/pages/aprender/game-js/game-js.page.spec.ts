import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameJSPage } from './game-js.page';

describe('GameJSPage', () => {
  let component: GameJSPage;
  let fixture: ComponentFixture<GameJSPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GameJSPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
