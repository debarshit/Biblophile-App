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

export type Visibility =
    | 'only_me'
    | 'friends'
    | 'followers'
    | 'everyone';