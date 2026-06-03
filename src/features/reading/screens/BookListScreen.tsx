import React from 'react';
import StatusShelfScreen from './StatusShelfScreen';
import TagShelfScreen from './TagShelfScreen';

/**
 * BookListScreen — route entry point only.
 *
 * Delegates to:
 *   TagShelfScreen    — when tagId is present
 *   StatusShelfScreen — when status / statusSlug is present
 */
const BookListScreen = ({ route, navigation }: any) => {
    const { tagId } = route.params ?? {};

    if (tagId) {
        return <TagShelfScreen route={route} navigation={navigation} />;
    }

    return <StatusShelfScreen route={route} navigation={navigation} />;
};

export default BookListScreen;