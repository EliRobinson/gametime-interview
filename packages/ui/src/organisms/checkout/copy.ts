export const CHECKOUT_COPY = {
  loading: 'Loading your checkout…',
  resumedEyebrow: 'Resumed checkout',
  finishTitle: 'Finish your checkout',
  completePurchase: 'Complete purchase',
  completing: 'Completing…',
  confirmNewPrice: 'Confirm at new price',
  checkingPrice: 'Checking price…',
  retry: 'Try again',
  retrying: 'Retrying…',
  priceChanged: {
    title: 'Price changed',
    bodyPrefix:
      "The seller's price for this listing moved while your checkout was open. You last agreed to",
    bodySuffix: 'Nothing has been charged.',
  },
  expired: {
    title: 'Checkout session expired',
    body: 'Your hold on these tickets lapsed, so this checkout is no longer available. Nothing was charged — start a new checkout to try again.',
  },
  unavailable: {
    title: 'Listing no longer available',
    body: 'These tickets were claimed before your purchase went through. Nothing was charged — browse similar seats instead.',
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
  priceChangedNoSession: 'The price for this listing changed. Reopen your checkout.',
  genericError: 'Something went wrong on our end. Please try again.',
} as const;
