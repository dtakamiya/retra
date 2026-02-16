export interface FilterState {
  searchText: string;
  sortByVotes: boolean;
  undiscussedOnly: boolean;
  myCardsOnly: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  searchText: '',
  sortByVotes: false,
  undiscussedOnly: false,
  myCardsOnly: false,
};
