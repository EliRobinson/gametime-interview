import type { CheckoutSession } from '@repo/api-contracts';
import { formatCurrency } from '@repo/utils';

import { Banner } from '../../atoms/Banner';
import { Button } from '../../atoms/Button';
import { Notice } from '../../atoms/Notice';
import { Spinner } from '../../atoms/Spinner';
import { Text } from '../../atoms/Text';
import { ActionStack } from '../../molecules/ActionStack';
import { Panel } from '../../molecules/Panel';
import { PriceRow } from '../../molecules/PriceRow';
import { CHECKOUT_COPY } from './copy';
import type { CheckoutView } from './types';

type CheckoutCardProps = {
  view: CheckoutView;
  busy: boolean;
  onComplete: (session: CheckoutSession) => void;
  onConfirmPrice: (session: CheckoutSession) => void;
};

export function CheckoutCard({ view, busy, onComplete, onConfirmPrice }: CheckoutCardProps) {
  switch (view.kind) {
    case 'loading':
      return <Spinner label={CHECKOUT_COPY.loading} />;

    case 'session':
      return renderSession(view.session, view.notice, busy, onComplete);

    case 'price_changed':
      return (
        <ActionStack>
          <Banner testID="price-changed-banner">
            <Text variant="title">{CHECKOUT_COPY.priceChanged.title}</Text>
            <Text variant="body">
              {formatPriceChangedBody(view.session.acknowledgedPrice, view.newPriceCents)}
            </Text>
          </Banner>
          <Button
            onPress={() => onConfirmPrice(view.session)}
            testID="confirm-price-button"
            variant="primary"
            disabled={busy}
          >
            {busy ? CHECKOUT_COPY.checkingPrice : CHECKOUT_COPY.confirmNewPrice}
          </Button>
        </ActionStack>
      );

    case 'expired':
      return <Panel title={CHECKOUT_COPY.expired.title} body={CHECKOUT_COPY.expired.body} />;

    case 'unavailable':
      return (
        <Panel title={CHECKOUT_COPY.unavailable.title} body={CHECKOUT_COPY.unavailable.body} />
      );

    case 'claimed_elsewhere':
      return (
        <Panel
          title={CHECKOUT_COPY.claimedElsewhere.title}
          body={CHECKOUT_COPY.claimedElsewhere.body}
        />
      );

    case 'not_found':
      return <Panel title={CHECKOUT_COPY.notFound.title} body={CHECKOUT_COPY.notFound.body} />;

    case 'error':
      return <Panel title={CHECKOUT_COPY.errorTitle} body={view.message} />;
  }
}

function renderSession(
  session: CheckoutSession,
  notice: string | null,
  busy: boolean,
  onComplete: (session: CheckoutSession) => void,
) {
  if (session.status === 'completed') {
    return (
      <Panel
        title={CHECKOUT_COPY.completed.title}
        body={`${CHECKOUT_COPY.completed.bodyPrefix} ${formatCurrency(
          session.acknowledgedPrice,
        )} ${CHECKOUT_COPY.completed.bodySuffix}`}
      />
    );
  }

  if (session.status === 'failed') {
    return (
      <Panel title={CHECKOUT_COPY.failed.title} body={CHECKOUT_COPY.failed.body}>
        <Text variant="muted" testID="failure-reason">
          {CHECKOUT_COPY.failed.reasonPrefix} {session.failureReason ?? 'unknown'}
        </Text>
        <Button
          onPress={() => onComplete(session)}
          testID="retry-button"
          variant="primary"
          disabled={busy}
        >
          {busy ? CHECKOUT_COPY.retrying : CHECKOUT_COPY.retry}
        </Button>
      </Panel>
    );
  }

  return (
    <ActionStack>
      <Text variant="eyebrow">{CHECKOUT_COPY.resumedEyebrow}</Text>
      <Text variant="title">{CHECKOUT_COPY.finishTitle}</Text>
      <PriceRow amountCents={session.acknowledgedPrice} testID="acknowledged-price" />
      {notice ? <Notice testID="price-notice">{notice}</Notice> : null}
      <Button
        onPress={() => onComplete(session)}
        testID="complete-button"
        variant="primary"
        disabled={busy}
      >
        {busy ? CHECKOUT_COPY.completing : CHECKOUT_COPY.completePurchase}
      </Button>
    </ActionStack>
  );
}

function formatPriceChangedBody(acknowledgedPrice: number, newPriceCents?: number): string {
  const acknowledged = `${CHECKOUT_COPY.priceChanged.bodyPrefix} ${formatCurrency(
    acknowledgedPrice,
  )}.`;
  const newPrice =
    newPriceCents !== undefined ? ` The new price is ${formatCurrency(newPriceCents)}.` : '';
  return `${acknowledged}${newPrice} ${CHECKOUT_COPY.priceChanged.bodySuffix}`;
}
