export const LISTINGS_COPY = {
  continue: 'CONTINUE',
  creating: 'STARTING CHECKOUT…',
  superDealBadge: 'SUPER DEAL',
  superDealTitle: 'You found a Super Deal!',
  superDealBody: 'These tickets are in the top 1% for this event, based on value.',
  seatsTogether: (count: number) => `${count} Seats Together`,
  priceEach: (formatted: string) => `${formatted} each including all fees`,
  unavailable: 'Unavailable',
  loadError: "Couldn't load listings. Try again.",
  retry: 'TRY AGAIN',
  selectPrompt: 'Select a listing to continue',
  createError: "Couldn't start checkout for these seats. Try another listing.",
} as const;
