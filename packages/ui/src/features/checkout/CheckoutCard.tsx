import type { CheckoutSession } from '@repo/api-contracts';
import { formatCurrency } from '@repo/utils';
import { View } from 'react-native';

import { Banner } from '../../atoms/Banner';
import { Button } from '../../atoms/Button';
import { Notice } from '../../atoms/Notice';
import { Spinner } from '../../atoms/Spinner';
import { Text } from '../../atoms/Text';
import { Panel } from '../../molecules/Panel';
import { PriceRow } from '../../molecules/PriceRow';
import type { ThemeName } from '../../theme';
import { ThemeProvider, useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';
import type { CheckoutView } from './checkout.view-model';

type CheckoutCardProps = {
  view: CheckoutView;
  busy: boolean;
  onComplete: (session: CheckoutSession) => void;
  onConfirmPrice: (session: CheckoutSession) => void;
  /** Defaults to light (web). Pass `dark` for Gametime mobile canvas. */
  theme?: ThemeName;
  /** When set, shows Share tickets for resumable sessions. */
  shareWebUrl?: string;
  shareMobileUrl?: string;
  onShare?: (payload: { webUrl: string; mobileUrl: string }) => void;
};

export function CheckoutCard({
  view,
  busy,
  onComplete,
  onConfirmPrice,
  theme = 'light',
  shareWebUrl,
  shareMobileUrl,
  onShare,
}: CheckoutCardProps) {
  return (
    <ThemeProvider theme={theme}>
      <CheckoutCardBody
        view={view}
        busy={busy}
        onComplete={onComplete}
        onConfirmPrice={onConfirmPrice}
        shareWebUrl={shareWebUrl}
        shareMobileUrl={shareMobileUrl}
        onShare={onShare}
      />
    </ThemeProvider>
  );
}

function CheckoutCardBody({
  view,
  busy,
  onComplete,
  onConfirmPrice,
  shareWebUrl,
  shareMobileUrl,
  onShare,
}: Omit<CheckoutCardProps, 'theme'>) {
  const theme = useTheme();
  const shareControls =
    shareWebUrl && shareMobileUrl ? (
      <ShareTickets webUrl={shareWebUrl} mobileUrl={shareMobileUrl} onShare={onShare} />
    ) : null;

  switch (view.kind) {
    case 'loading':
      return <Spinner label={CHECKOUT_COPY.loading} subtitle={CHECKOUT_COPY.loadingSubtitle} />;

    case 'ready':
      return (
        <View style={{ gap: theme.space[4] }}>
          <Text variant="eyebrow">{CHECKOUT_COPY.resumedEyebrow}</Text>
          <Text variant="title">{CHECKOUT_COPY.finishTitle}</Text>
          <PriceRow amountCents={view.session.acknowledgedPrice} testID="acknowledged-price" />
          {view.notice ? <Notice testID="price-notice">{view.notice}</Notice> : null}
          <Button
            onPress={() => onComplete(view.session)}
            testID="complete-button"
            variant="primary"
            disabled={busy}
          >
            {busy ? CHECKOUT_COPY.completing : CHECKOUT_COPY.completePurchase}
          </Button>
          {shareControls}
        </View>
      );

    case 'completed':
      return (
        <Panel
          title={CHECKOUT_COPY.completed.title}
          body={`${CHECKOUT_COPY.completed.bodyPrefix} ${formatCurrency(
            view.session.acknowledgedPrice,
          )} ${CHECKOUT_COPY.completed.bodySuffix}`}
        />
      );

    case 'failed':
      return (
        <Panel title={CHECKOUT_COPY.failed.title} body={CHECKOUT_COPY.failed.body}>
          <Text variant="muted" testID="failure-reason">
            {CHECKOUT_COPY.failed.reasonPrefix} {view.session.failureReason ?? 'unknown'}
          </Text>
          <Button
            onPress={() => onComplete(view.session)}
            testID="retry-button"
            variant="primary"
            disabled={busy}
          >
            {busy ? CHECKOUT_COPY.retrying : CHECKOUT_COPY.retry}
          </Button>
          {shareControls}
        </Panel>
      );

    case 'price_changed':
      return (
        <View style={{ gap: theme.space[4] }}>
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
          {shareControls}
        </View>
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

function ShareTickets({
  webUrl,
  mobileUrl,
  onShare,
}: {
  webUrl: string;
  mobileUrl: string;
  onShare?: (payload: { webUrl: string; mobileUrl: string }) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[2] }} testID="share-tickets">
      <Text variant="muted">{CHECKOUT_COPY.shareTicketsHint}</Text>
      <Button
        testID="share-tickets-button"
        variant="secondary"
        onPress={() => onShare?.({ webUrl, mobileUrl })}
      >
        {CHECKOUT_COPY.shareTickets}
      </Button>
      <Text variant="muted" testID="share-web-url">
        {webUrl}
      </Text>
      <Text variant="muted" testID="share-mobile-url">
        {mobileUrl}
      </Text>
    </View>
  );
}

function formatPriceChangedBody(acknowledgedPrice: number, newPriceCents?: number): string {
  const acknowledged = `${CHECKOUT_COPY.priceChanged.bodyPrefix} ${formatCurrency(
    acknowledgedPrice,
  )}.`;
  const newPrice =
    newPriceCents !== undefined
      ? ` ${CHECKOUT_COPY.priceChanged.newPricePrefix} ${formatCurrency(newPriceCents)}.`
      : '';
  return `${acknowledged}${newPrice} ${CHECKOUT_COPY.priceChanged.bodySuffix}`;
}
