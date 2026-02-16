import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiscussionProgress } from './DiscussionProgress';
import { createCard } from '../test/fixtures';

describe('DiscussionProgress', () => {
  it('renders nothing when no cards', () => {
    const { container } = render(<DiscussionProgress cards={[]} color="#22c55e" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows 0/N when no cards are discussed', () => {
    const cards = [createCard({ id: 'c1' }), createCard({ id: 'c2' })];
    render(<DiscussionProgress cards={cards} color="#22c55e" />);
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });

  it('shows X/N when some cards are discussed', () => {
    const cards = [
      createCard({ id: 'c1', isDiscussed: true }),
      createCard({ id: 'c2', isDiscussed: false }),
      createCard({ id: 'c3', isDiscussed: true }),
    ];
    render(<DiscussionProgress cards={cards} color="#22c55e" />);
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    const cards = [createCard({ id: 'c1', isDiscussed: true })];
    render(<DiscussionProgress cards={cards} color="#22c55e" />);
    expect(screen.getByLabelText('議論進捗 1/1')).toBeInTheDocument();
  });

  it('applies column color to progress bar', () => {
    const cards = [createCard({ id: 'c1', isDiscussed: true })];
    const { container } = render(<DiscussionProgress cards={cards} color="#ef4444" />);
    const bar = container.querySelector('[style*="background-color"]');
    expect(bar).toHaveStyle({ backgroundColor: '#ef4444' });
  });
});
