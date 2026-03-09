import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdsList } from './ads-list';

describe('AdsList', () => {
  let component: AdsList;
  let fixture: ComponentFixture<AdsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
