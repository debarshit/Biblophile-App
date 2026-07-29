import { Text, VStack, HStack, Spacer, ProgressView, Image } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import {
  background,
  font,
  foregroundStyle,
  padding,
  frame,
  tint
} from '@expo/ui/swift-ui/modifiers';

type ShelfProps = {
  bookTitle?: string;
  bookAuthor?: string;
  progressText?: string;
  progressValue?: number;
  percentageText?: string;
};

const ReadingShelfWidget = (props: ShelfProps, environment: WidgetEnvironment) => {
  'widget';

  const bookTitle = props?.bookTitle || 'No book selected';
  const bookAuthor = props?.bookAuthor || 'Start reading in Biblophile!';

  const progressText = props?.progressText || '';
  const progressValue = props?.progressValue ?? 0;
  const percentageText = props?.percentageText || '0%';

  const isNoBook = bookTitle === 'No book selected';

  return (
    <VStack
      spacing={8}
      modifiers={[
        background('#0C0F14'),
        padding({ all: 16 }),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      ]}
    >
      <HStack modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
        <Image
          systemName="book.fill"
          color="#D17842"
          size={14}
        />
        <Spacer minLength={6} />
        <Text
          modifiers={[
            font({ size: 11, weight: 'bold', design: 'rounded' }),
            foregroundStyle('#D17842')
          ]}
        >
          BIBLOPHILE
        </Text>
        <Spacer />
      </HStack>

      <Spacer />

      {isNoBook ? (
        <VStack
          alignment="leading"
          spacing={4}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}
        >
          <Text
            modifiers={[
              font({ size: 14, weight: 'semibold', design: 'rounded' }),
              foregroundStyle('#FFFFFF')
            ]}
          >
            No active books
          </Text>
          <Text
            modifiers={[
              font({ size: 11, design: 'rounded' }),
              foregroundStyle('#AEAEAE')
            ]}
          >
            Open Biblophile to start reading and tracking progress!
          </Text>
        </VStack>
      ) : (
        <VStack
          alignment="leading"
          spacing={2}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}
        >
          <Text
            modifiers={[
              font({ size: 15, weight: 'bold', design: 'rounded' }),
              foregroundStyle('#FFFFFF')
            ]}
          >
            {bookTitle}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: 'medium', design: 'rounded' }),
              foregroundStyle('#AEAEAE')
            ]}
          >
            by {bookAuthor}
          </Text>
          
          <Spacer minLength={8} />

          <HStack modifiers={[frame({ maxWidth: Infinity })]}>
            <Text
              modifiers={[
                font({ size: 11, weight: 'medium', design: 'rounded' }),
                foregroundStyle('#AEAEAE')
              ]}
            >
              {progressText}
            </Text>
            <Spacer />
            <Text
              modifiers={[
                font({ size: 11, weight: 'bold', design: 'rounded' }),
                foregroundStyle('#D17842')
              ]}
            >
              {percentageText}
            </Text>
          </HStack>

          <ProgressView
            value={progressValue}
            modifiers={[
              tint('#D17842'),
              frame({ height: 4 })
            ]}
          />
        </VStack>
      )}

      <Spacer />
    </VStack>
  );
};

export default createWidget('ReadingShelfWidget', ReadingShelfWidget);