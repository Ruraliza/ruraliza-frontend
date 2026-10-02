import { Subject } from 'rxjs';
import { RemoteData } from './remote-data';

describe('RemoteData', () => {
  it('load goes back to loading; refresh keeps the current data until the answer arrives', () => {
    let response = new Subject<number>();
    const data = new RemoteData(() => response);

    data.load();
    expect(data.state().status).toBe('loading');
    response.next(1);
    expect(data.data()).toBe(1);

    response = new Subject<number>();
    data.refresh();
    expect(data.state()).toEqual({ status: 'success', data: 1 });
    response.next(2);
    expect(data.data()).toBe(2);

    response = new Subject<number>();
    data.load();
    expect(data.state().status).toBe('loading');
  });

  it('refresh before any data behaves like load', () => {
    const data = new RemoteData(() => new Subject<number>());
    data.refresh();
    expect(data.state().status).toBe('loading');
  });
});
