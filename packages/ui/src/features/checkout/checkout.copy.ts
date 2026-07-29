export const CHECKOUT_COPY = {
  loading: 'Finding your checkout',
  loadingSubtitle: "So you don't have to.",
  pageTitle: 'Checkout',
  /** Visible cancel word on wide web checkout headers (chevron rendered in UI). */
  cancelLabel: 'Cancel',
  /** Accessible name for the cancel control (icon-only on narrow screens). */
  cancelAriaLabel: 'Cancel purchase',
  /** Visible leave word after a successful purchase (same header control). */
  doneLabel: 'Done',
  /** Accessible name for the post-purchase leave control. */
  doneAriaLabel: 'Done',
  completePurchase: 'CONTINUE',
  completing: 'CONTINUING…',
  confirmNewPrice: 'CONFIRM NEW PRICE',
  checkingPrice: 'CHECKING…',
  retry: 'TRY AGAIN',
  retrying: 'RETRYING…',
  shareTickets: 'Share tickets',
  shareTicketsHint: 'Copy a web link to resume this checkout in any browser.',
  copyWebLink: 'Copy web link',
  copyMobileLink: 'Copy app link',
  /** Shown before abandoning an active hold (browser back / logo / unload). */
  leaveLockWarning: 'Leaving this page will remove the lock on the ticket',
  priceUpdatedPrefix: 'Price updated to',
  contactLabel: 'Contact',
  /** Static demo email — not auth-backed. */
  contactEmail: 'eli.h.robinson@gmail.com',
  ticketDeliveryLabel: 'Ticket Delivery',
  termsPrefix: 'By purchasing you agree to our ',
  termsOfUse: 'Terms of Use',
  termsAnd: ' and ',
  privacyPolicy: 'Privacy Policy',
  ticketsLabel: 'Tickets',
  totalLabel: 'Total',
  addPromoCode: 'Add Promo Code',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  mobileTransfer: 'Mobile Transfer Ticket',
  seatsTogether: (count: number) => `${count} Seats Together`,
  seatLine: (section: string, row: string) => `Sec ${section} · Row ${row}`,
  seatLineWeb: (section: string, row: string) => `Upper ${section}, Row ${row}`,
  venueLine: (venue: string, city: string) => `${venue} · ${city}`.toUpperCase(),
  urgencyTicketsLeft: (count: number) => `Only ${count} tickets left at this price!`,
  urgencyFallback: 'Only a few tickets left at this price!',
  superDealTitle: 'You found a Super Deal!',
  superDealBody: 'These tickets are in the top 1% for this event, based on value.',
  guaranteeTitle: 'Your tickets are 100% covered by our Gametime Guarantee',
  guaranteeItems: [
    'Lowest price guarantee',
    'Event cancellation protection',
    'On-time ticket delivery',
  ] as const,
  ticketProtectionTitle: 'Add Ticket Protection',
  ticketProtectionPrice: 'For $15.21 per ticket',
  ticketProtectionAdd: 'ADD +',
  ticketProtectionBody:
    'Get reimbursed if you can’t attend due to covered reasons like illness or injury. ',
  ticketProtectionLearnMore: 'Learn More',
  ticketProtectionPoweredBy: 'Powered by XCOVER.COM',
  priceChanged: {
    title: 'Price changed',
    bodyPrefix:
      "The seller's price for this listing moved while your checkout was open. You last agreed to",
    bodySuffix: 'Nothing has been charged.',
    newPricePrefix: 'The new price is',
  },
  expired: {
    title: 'Checkout session expired',
    body: 'Your hold on these tickets lapsed, so this checkout is no longer available. Nothing was charged — start a new checkout to try again.',
  },
  unavailable: {
    title: 'Listing no longer available',
    body: 'These tickets were claimed before your purchase went through. Nothing was charged — browse similar seats instead.',
  },
  processing: {
    title: 'Payment in progress',
    body: "We're finishing your order now. This screen will update when the charge succeeds or fails — don't tap Buy again.",
  },
  claimedElsewhere: {
    title: 'Finishing on another device',
    body: 'This order is already being completed on another device. Nothing is wrong — check that device, or come back in a moment to see the confirmation.',
  },
  notFound: {
    title: 'Checkout not found',
    body: "We couldn't find this checkout. The link may be out of date — start a new checkout from the listing.",
  },
  errorTitle: 'Checkout unavailable',
  completed: {
    title: 'Order complete',
    bodyPrefix: "You're all set —",
    bodySuffix: 'charged. Your tickets are on their way to your account.',
  },
  failed: {
    title: "Payment didn't go through",
    body: 'Your seats are still held. You can try the payment again.',
    reasonPrefix: 'Reason:',
  },
} as const;
