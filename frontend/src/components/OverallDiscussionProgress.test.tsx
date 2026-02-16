import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OverallDiscussionProgress } from './OverallDiscussionProgress';
import { createColumn, createCard } from '../test/fixtures';

describe('OverallDiscussionProgress', () => {
  it('renders nothing when no cards exist', () => {
    const columns = [createColumn({ cards: [] })];
    const { container } = render(<OverallDiscussionProgress columns={columns} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows overall progress across columns', () => {
    const columns = [
      createColumn({
        id: 'col-1',
        cards: [
          createCard({ id: 'c1', isDiscussed: true }),
          createCard({ id: 'c2', isDiscussed: false }),
        ],
      }),
      createColumn({
        id: 'col-2',
        cards: [
          createCard({ id: 'c3', isDiscussed: true }),
        ],
      }),
    ];
    render(<OverallDiscussionProgress columns={columns} />);
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    const columns = [
      createColumn({
        cards: [createCard({ id: 'c1', isDiscussed: true })],
      }),
    ];
    render(<OverallDiscussionProgress columns={columns} />);
    expect(screen.getByLabelText('全体議論進捗 1/1')).toBeInTheDocument();
  });

  it('shows label text', () => {
    const columns = [
      createColumn({
        cards: [createCard({ id: 'c1' })],
      }),
    ];
    render(<OverallDiscussionProgress columns={columns} />);
    expect(screen.getByText('議論済み')).toBeInTheDocument();
  });
});
