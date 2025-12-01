import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Fase2Page } from './fase2.page';

describe('Fase2Page', () => {
  let component: Fase2Page;
  let fixture: ComponentFixture<Fase2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Fase2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
