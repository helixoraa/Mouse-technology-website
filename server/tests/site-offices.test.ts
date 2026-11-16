import { describe, expect, it } from 'vitest';
import { siteOffices } from '../src/routes/public.js';

describe('siteOffices', () => {
  it('returns footer.offices when present', () => {
    const offices = [{ name: 'Maouaj Technology Corporation', address: '999 Broadway', phone: '+1 (716) 533-2271' }];
    expect(siteOffices({ phone: 'x', address: 'y', footer: { offices } })).toEqual(offices);
  });
  it('falls back to the single phone/address for older data without offices', () => {
    expect(siteOffices({ phone: '[Business telephone]', address: '[Address]', footer: { columns: [] } })).toEqual([
      { name: '', address: '[Address]', phone: '[Business telephone]' },
    ]);
  });
  it('ignores malformed entries and returns [] when nothing is set', () => {
    expect(siteOffices({ phone: '', address: '', footer: { offices: [null, 3, {}] } })).toEqual([]);
    expect(siteOffices({ phone: '', address: '', footer: null })).toEqual([]);
  });
});
