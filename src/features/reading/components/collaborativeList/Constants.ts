import { Dimensions } from 'react-native';
import { SPACING } from '../../../../theme/theme';
import type { ListSettings } from '../../types';

const { width } = Dimensions.get('window');

export const CARD_MARGIN = SPACING.space_8;
export const CONTAINER_PADDING = SPACING.space_16;
export const AVAILABLE_WIDTH = width - CONTAINER_PADDING * 2;
export const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN * 2) / 3;
export const PAGE_SIZE = 10;
export const APP_BASE_URL = 'https://biblophile.com';

export const DEFAULT_LIST_SETTINGS: ListSettings = {
    listVisibility: 'members',
    booksVisibility: 'members',
    membersVisibility: 'members',
    joinPolicy: 'invite_only',
    defaultMemberRole: 'viewer',
};

export const LIST_VISIBILITY_OPTIONS = [
    { label: 'Everyone', value: 'everyone' },
    { label: 'Members', value: 'members' },
    { label: 'Only me', value: 'only_me' },
];

export const JOIN_POLICY_OPTIONS = [
    { label: 'Open', value: 'open' },
    { label: 'Request', value: 'request' },
    { label: 'Invite only', value: 'invite_only' },
];

export const ACTION_LABELS: Record<string, string> = {
    added_book: 'added',
    removed_book: 'removed',
    joined: 'joined the list',
    left: 'left the list',
};

export const STATUS_SLUG_MAP: Record<string, string> = {
    'Currently reading': 'currently-reading',
    'To be read': 'to-be-read',
    'Did not finish': 'did-not-finish',
    'Read': 'read',
};

export const SLUG_STATUS_MAP: Record<string, string> = {
    'currently-reading': 'Currently reading',
    'to-be-read': 'To be read',
    'did-not-finish': 'Did not finish',
    'read': 'Read',
};