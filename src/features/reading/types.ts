export interface Book {
    bookId: number;
    userBookId: number;
    bookPhoto: string;
    status: string;
    startDate: string;
    endDate: string;
    progressUnit?: 'pages' | 'percentage' | 'seconds';
    progressValue: number | null;
    position?: number;
    visibility: 'only_me' | 'friends' | 'followers' | 'everyone';
}

export interface ShelfUser {
    userId: number;
    userName: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    profilePic: string;
    sourceReferral: string;
    isPageOwner: boolean;
}

export type Visibility = 'only_me' | 'friends' | 'followers' | 'everyone';
export type Tab = 'books' | 'members' | 'activity';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface Membership {
    role: MemberRole;
    status: 'accepted' | 'pending';
    initiatedBy?: 'member' | 'owner';
}

export interface ListSettings {
    listVisibility: 'members_only' | 'friends' | 'followers' | 'everyone';
    booksVisibility: 'members_only' | 'friends' | 'followers' | 'everyone';
    membersVisibility: 'members_only' | 'friends' | 'followers' | 'everyone';
    joinPolicy: 'invite_only' | 'request_only' | 'open';
    defaultMemberRole: 'editor' | 'viewer';
    description?: string;
    maxMembers?: number;
}
export interface Member {
    userId: number;
    name: string;
    userName: string;
    userProfilePic: string;
    role: MemberRole;
}
 
export interface PendingRow {
    id: number;
    userId: number;
    name: string;
    userName: string;
    userProfilePic: string;
    initiatedBy: 'member' | 'owner';
}
 
export interface ActivityItem {
    id: number;
    userName: string;
    userProfilePic: string;
    action: string;
    workTitle?: string;
    createdAt: string;
}