import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterCounter } from './CharacterCounter';

describe('CharacterCounter', () => {
  it('displays current/max count', () => {
    render(<CharacterCounter current={100} max={2000} />);
    expect(screen.getByText('100/2000')).toBeInTheDocument();
  });

  it('shows normal style when plenty of characters remain', () => {
    render(<CharacterCounter current={500} max={2000} />);
    const el = screen.getByText('500/2000');
    expect(el.className).toContain('text-gray-400');
  });

  it('shows warning style when 200 or fewer characters remain', () => {
    render(<CharacterCounter current={1801} max={2000} />);
    const el = screen.getByText('1801/2000');
    expect(el.className).toContain('text-amber-500');
  });

  it('shows error style when at or over the limit', () => {
    render(<CharacterCounter current={2000} max={2000} />);
    const el = screen.getByText('2000/2000');
    expect(el.className).toContain('text-red-500');
  });

  it('shows error style when over limit', () => {
    render(<CharacterCounter current={2100} max={2000} />);
    const el = screen.getByText('2100/2000');
    expect(el.className).toContain('text-red-500');
  });

  it('has accessible label with remaining count', () => {
    render(<CharacterCounter current={1900} max={2000} />);
    expect(screen.getByLabelText('残り100文字')).toBeInTheDocument();
  });
});
