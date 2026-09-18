import { cn } from './utils';

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b');
  });

  it('resolves conflicting tailwind classes by keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('supports the conditional-object form', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
