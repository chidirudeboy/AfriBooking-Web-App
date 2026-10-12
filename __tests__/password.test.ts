import { getPasswordChecks, getPasswordError } from '@/lib/utils/password';

describe('password rules', () => {
  it('accepts a valid password', () => {
    expect(getPasswordError('Abcdef1!')).toBeNull();
  });
  it('reports length', () => {
    expect(getPasswordError('Ab1!')).toMatch(/too short/);
  });
  it('reports missing uppercase / lowercase / number / special', () => {
    expect(getPasswordError('abcdef1!')).toMatch(/UPPERCASE/);
    expect(getPasswordError('ABCDEF1!')).toMatch(/lowercase/);
    expect(getPasswordError('Abcdefg!')).toMatch(/number/);
    expect(getPasswordError('Abcdefg1')).toMatch(/special character/);
  });
  it('rejects special characters the backend does not accept', () => {
    expect(getPasswordError('Abcdef1#')).toMatch(/special character/);
    expect(getPasswordError('Abcdef1!#')).toMatch(/not allowed \(#\)/);
  });
  it('marks each check individually', () => {
    const c = getPasswordChecks('abc');
    expect(c.find((x) => x.key === 'lowercase')?.passed).toBe(true);
    expect(c.find((x) => x.key === 'uppercase')?.passed).toBe(false);
  });
  it('matches the backend regex', () => {
    const backend = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    for (const pw of ['Abcdef1!', 'abcdef1!', 'Abcdef1#', 'Ab1!', 'Abcdefg1', 'Abc def1!', 'Abcdef1!é']) {
      expect(getPasswordError(pw) === null).toBe(backend.test(pw));
    }
  });
});
