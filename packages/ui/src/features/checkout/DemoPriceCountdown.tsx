import { msUntilDemoPriceBump } from '@repo/api-contracts';
import { colors } from '@repo/tokens';
import { useEffect, useState } from 'react';
import { Text as RNText, View } from 'react-native';

import { useTheme } from '../../theme';

type DemoPriceCountdownProps = {
  listingId: string;
  createdAt: string;
  /** When false, hide even if this is the demo listing. */
  visible?: boolean;
  testID?: string;
};

/**
 * Inline demo-only countdown so reviewers can see when the timed price bump
 * will surface. Renders nothing for non-demo listings or once the bump is due.
 */
export function DemoPriceCountdown({
  listingId,
  createdAt,
  visible = true,
  testID = 'demo-price-countdown',
}: DemoPriceCountdownProps) {
  const theme = useTheme();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    secondsUntilBump(listingId, createdAt),
  );

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(null);
      return;
    }

    function tick() {
      setSecondsLeft(secondsUntilBump(listingId, createdAt));
    }

    tick();
    const intervalId = setInterval(tick, 250);
    return () => clearInterval(intervalId);
  }, [createdAt, listingId, visible]);

  if (!visible || secondsLeft === null || secondsLeft <= 0) return null;

  return (
    <View
      testID={testID}
      accessibilityRole="timer"
      accessibilityLabel={`Demo price change in ${secondsLeft} seconds`}
    >
      <RNText
        style={{
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.bold,
          lineHeight: 22,
          color: colors.accent,
          fontVariant: ['tabular-nums'],
        }}
      >
        {secondsLeft}s
      </RNText>
    </View>
  );
}

function secondsUntilBump(listingId: string, createdAt: string): number | null {
  const remainingMs = msUntilDemoPriceBump({ listingId, createdAt });
  if (remainingMs === null) return null;
  return Math.ceil(remainingMs / 1000);
}
