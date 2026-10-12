import { describe, it, expect } from 'bun:test';
import { isAnonOnly, isProtected } from './proxy';

describe('isProtected', () => {
  it('guards the routes whose modal reads the current user', () => {
    for (const pathname of [
      '/film/550-fight-club/review',
      '/tv-series/1396-breaking-bad/review',
      '/film/550-fight-club/watched-dates',
      '/playlist/12/edit',
      '/playlist/12/edit/members',
      '/playlist/12/edit/members/add',
      '/playlist/create',
      '/playlist/add/movie/550',
      '/reco/send/movie/550',
      '/collection',
      '/feed',
      '/feed/persons',
      '/settings',
      '/settings/profile',
      '/auth/consent',
    ]) {
      expect(isProtected(pathname)).toBe(true);
    }
  });

  it('leaves the public pages alone', () => {
    for (const pathname of [
      '/',
      '/film/550-fight-club',
      '/film/550-fight-club/reviews',
      '/film/550-fight-club/playlists',
      '/tv-series/1396-breaking-bad',
      '/tv-series/1396-breaking-bad/season/2',
      '/person/525-christopher-nolan',
      '/person/525-christopher-nolan/details',
      '/playlist/12',
      '/@loup',
      '/@loup/film/550-fight-club',
      '/explore',
      '/welcome',
    ]) {
      expect(isProtected(pathname)).toBe(false);
    }
  });

  // `/reviews` is the public list; `/review` is the form. One character apart, and the
  // regex has to tell them apart or the film page itself starts demanding a login.
  it('does not confuse the review form with the public review list', () => {
    expect(isProtected('/film/550-fight-club/review')).toBe(true);
    expect(isProtected('/film/550-fight-club/reviews')).toBe(false);
  });

  it('does not guard a playlist that merely contains the word edit', () => {
    expect(isProtected('/playlist/12-my-edited-list')).toBe(false);
  });
});

describe('isAnonOnly', () => {
  it('covers the sign-in flow and nothing else', () => {
    expect(isAnonOnly('/auth/login')).toBe(true);
    expect(isAnonOnly('/auth/signup')).toBe(true);
    expect(isAnonOnly('/auth/forgot-password')).toBe(true);
    expect(isAnonOnly('/auth/reset-password')).toBe(true);
    expect(isAnonOnly('/auth/consent')).toBe(false);
    expect(isAnonOnly('/')).toBe(false);
  });
});
