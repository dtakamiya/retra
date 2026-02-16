import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BoardFilterBar } from './BoardFilterBar';
import { DEFAULT_FILTER_STATE } from '../types/filter';
import type { FilterState } from '../types/filter';

describe('BoardFilterBar', () => {
  const defaultProps = {
    filter: DEFAULT_FILTER_STATE,
    onFilterChange: vi.fn(),
    showDiscussionFilter: false,
  };

  it('renders search input', () => {
    render(<BoardFilterBar {...defaultProps} />);
    expect(screen.getByLabelText('カード検索')).toBeInTheDocument();
  });

  it('renders filter chips', () => {
    render(<BoardFilterBar {...defaultProps} />);
    expect(screen.getByText('投票数順')).toBeInTheDocument();
    expect(screen.getByText('自分のカード')).toBeInTheDocument();
  });

  it('shows undiscussed filter when showDiscussionFilter is true', () => {
    render(<BoardFilterBar {...defaultProps} showDiscussionFilter />);
    expect(screen.getByText('未議論のみ')).toBeInTheDocument();
  });

  it('hides undiscussed filter when showDiscussionFilter is false', () => {
    render(<BoardFilterBar {...defaultProps} showDiscussionFilter={false} />);
    expect(screen.queryByText('未議論のみ')).not.toBeInTheDocument();
  });

  it('calls onFilterChange when typing in search', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<BoardFilterBar {...defaultProps} onFilterChange={onFilterChange} />);
    const input = screen.getByLabelText('カード検索');
    await user.type(input, 'test');
    expect(onFilterChange).toHaveBeenCalled();
  });

  it('calls onFilterChange when toggling filter chip', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<BoardFilterBar {...defaultProps} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText('投票数順'));
    expect(onFilterChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTER_STATE,
      sortByVotes: true,
    });
  });

  it('shows reset button when filter is active', () => {
    const filter: FilterState = { ...DEFAULT_FILTER_STATE, searchText: 'test' };
    render(<BoardFilterBar {...defaultProps} filter={filter} />);
    expect(screen.getByText('リセット')).toBeInTheDocument();
  });

  it('hides reset button when no filter is active', () => {
    render(<BoardFilterBar {...defaultProps} />);
    expect(screen.queryByText('リセット')).not.toBeInTheDocument();
  });

  it('resets all filters when clicking reset', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const filter: FilterState = { ...DEFAULT_FILTER_STATE, sortByVotes: true };
    render(<BoardFilterBar {...defaultProps} filter={filter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText('リセット'));
    expect(onFilterChange).toHaveBeenCalledWith(DEFAULT_FILTER_STATE);
  });

  it('shows clear button when search has text', () => {
    const filter: FilterState = { ...DEFAULT_FILTER_STATE, searchText: 'hello' };
    render(<BoardFilterBar {...defaultProps} filter={filter} />);
    expect(screen.getByLabelText('検索をクリア')).toBeInTheDocument();
  });

  it('clears search text when clicking clear button', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const filter: FilterState = { ...DEFAULT_FILTER_STATE, searchText: 'hello' };
    render(<BoardFilterBar {...defaultProps} filter={filter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByLabelText('検索をクリア'));
    expect(onFilterChange).toHaveBeenCalledWith({ ...filter, searchText: '' });
  });
});
