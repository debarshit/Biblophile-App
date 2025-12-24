import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableWithoutFeedback,
    TouchableOpacity
} from 'react-native';
import { DragListRenderItemInfo } from 'react-native-draglist';
import BookshelfCard from '../components/BookshelfCard';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { AntDesign } from '@expo/vector-icons';

const QUEUE_CARD_WIDTH = 120;
const QUEUE_CARD_MARGIN = SPACING.space_12;

interface Book {
    bookId: number;
    userBookId: number;
    bookPhoto: string;
    status: string;
    startDate: string;
    endDate: string;
    currentPage: number;
    position?: number;
}

interface DraggableQueueItemProps extends DragListRenderItemInfo<Book> {
    userData: any;
    navigation: any;
    onRemove: (userBookId: number) => void;
}

const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({ 
    item, 
    onDragStart, 
    onDragEnd,
    isActive,
    userData,
    navigation,
    onRemove
}) => {
    return (
        <TouchableWithoutFeedback
            onPressIn={onDragStart}
            onPressOut={onDragEnd}
        >
            <View
                style={[
                    styles.queueCard,
                    isActive && styles.queueCardActive,
                ]}
            >
                <View style={styles.queueCardContent}>
                    <View style={styles.dragHandle}>
                        <AntDesign name="menufold" size={20} color={COLORS.secondaryLightGreyHex} />
                    </View>
                    
                    <View style={styles.queueBookCover}>
                        <BookshelfCard
                            id={item.bookId.toString()}
                            isPageOwner={userData.isPageOwner}
                            photo={convertHttpToHttps(item.bookPhoto)}
                            status={item.status}
                            startDate={item.startDate}
                            endDate={item.endDate}
                            currentPage={item.currentPage}
                            onUpdate={null}
                            navigation={navigation}
                        />
                    </View>

                    <View style={styles.queuePosition}>
                        <Text style={styles.positionText}>#{item.position}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onRemove(item.userBookId)}
                    >
                        <AntDesign name="close" size={18} color={COLORS.primaryRedHex} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    queueCard: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        marginRight: QUEUE_CARD_MARGIN,
        width: QUEUE_CARD_WIDTH,
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    queueCardActive: {
        opacity: 0.8,
        transform: [{ scale: 1.05 }],
    },
    queueCardContent: {
        position: 'relative',
        padding: SPACING.space_8,
    },
    dragHandle: {
        position: 'absolute',
        top: SPACING.space_4,
        left: SPACING.space_4,
        zIndex: 10,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_4,
    },
    queueBookCover: {
        width: '100%',
        aspectRatio: 2/3,
        borderRadius: BORDERRADIUS.radius_10,
        overflow: 'hidden',
    },
    queuePosition: {
        position: 'absolute',
        top: SPACING.space_8,
        right: SPACING.space_8,
        backgroundColor: COLORS.primaryOrangeHex,
        borderRadius: BORDERRADIUS.radius_10,
        paddingHorizontal: SPACING.space_8,
        paddingVertical: SPACING.space_4,
    },
    positionText: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_12,
        color: COLORS.primaryWhiteHex,
    },
    removeButton: {
        position: 'absolute',
        bottom: SPACING.space_8,
        right: SPACING.space_8,
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_20,
        padding: SPACING.space_4,
    },
});

export default DraggableQueueItem;