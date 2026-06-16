import { Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type ShelfProps = {
  bookTitle: string;
};

const ReadingShelfWidget = (props: ShelfProps, environment: WidgetEnvironment) => {
  return (
    <VStack>
      <Text>{props.bookTitle || 'No book selected'}</Text>
      <Text>Shelf Status: {environment.widgetFamily}</Text>
    </VStack>
  );
};

export default createWidget('ReadingShelfWidget', ReadingShelfWidget);