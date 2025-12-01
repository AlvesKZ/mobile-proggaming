import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Fase1Page } from './fase1.page';

describe('Fase1Page', () => {
  let component: Fase1Page;
  let fixture: ComponentFixture<Fase1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Fase1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
