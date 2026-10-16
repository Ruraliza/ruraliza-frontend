import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportService } from '@core/api/report.service';
import { ReportInput } from '@core/models/report.model';
import { CurrentUserService } from '@core/session/current-user.service';
import { reasonOptions } from '../utils/reports';
import { ReportDialog, ReportTarget } from './report-dialog';

describe('ReportDialog', () => {
  let sent: { role: string; profileId: number; input: ReportInput }[];

  beforeAll(() => {
    // O jsdom não abre <dialog> modal.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  });

  function open(target: ReportTarget, role: 'farmer' | 'worker' = 'worker'): ReportDialog {
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: CurrentUserService, useValue: { user: signal({ profiles: { farmer: 3, worker: 7 } }) } },
        { provide: ReportService, useValue: { send: (r: string, id: number, input: ReportInput) => { sent.push({ role: r, profileId: id, input }); return of({}); } } }
      ]
    });
    const fixture = TestBed.createComponent(ReportDialog);
    fixture.componentRef.setInput('role', role);
    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('offers the reasons that fit the target', () => {
    expect(reasonOptions('service').map((o) => o.value)).toEqual(['fraude', 'condicoes', 'ofensivo', 'outro']);
    expect(reasonOptions('worker').map((o) => o.value)).toEqual(['comportamento', 'fraude', 'ofensivo', 'outro']);
  });

  it('names the job or the person in the title', () => {
    expect(open({ type: 'service', id: 1, name: 'Colheita de café' }).heading()).toBe('Denunciar vaga');
    TestBed.resetTestingModule();
    const dialog = open({ type: 'farmer', id: 2, name: 'João Produtor' });
    expect([dialog.heading(), dialog.who()]).toEqual(['Denunciar João Produtor', 'João']);
  });

  it('asks for the story when the reason is "outro"', () => {
    const dialog = open({ type: 'service', id: 1, name: 'Colheita de café' });
    dialog.reason.set('outro');
    dialog.details.set('   ');

    dialog.submit(new Event('submit'));

    expect(dialog.detailsError()).toBe(true);
    expect(sent).toEqual([]);
  });

  it('sends the report as the open profile and closes', () => {
    const dialog = open({ type: 'worker', id: 9, name: 'Pedro' }, 'farmer');
    let closed = 0;
    dialog.closed.subscribe(() => closed++);
    dialog.reason.set('comportamento');
    dialog.details.set('  Faltou sem avisar.  ');

    dialog.submit(new Event('submit'));

    expect(sent).toEqual([{ role: 'farmer', profileId: 3, input: { target_type: 'worker', target_id: 9, reason: 'comportamento', details: 'Faltou sem avisar.' } }]);
    expect(closed).toBe(1);
  });
});
