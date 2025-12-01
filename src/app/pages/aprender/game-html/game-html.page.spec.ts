import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameHTMLPage } from './game-html.page';

describe('GameHTMLPage', () => {
  let component: GameHTMLPage;
  let fixture: ComponentFixture<GameHTMLPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GameHTMLPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
