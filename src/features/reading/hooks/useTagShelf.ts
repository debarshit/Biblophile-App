import { useCallback, useEffect, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useShelfUser } from './useShelfUser';
import { Book, ShelfUser, Visibility } from '../types';

interface UseTagShelfOptions {
    tagId: number;
    userData?: ShelfUser;
    username?: string;
}

export function useTagShelf({
    tagId,
    userData,
    username,
}: UseTagShelfOptions) {
    const {
        accessToken,
        resolvedUserData,
        isFetchingUser,
    } = useShelfUser({
        userData,
        username,
    });

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [currentVisibility, setCurrentVisibility] =
        useState<Visibility>('everyone');

    useEffect(() => {
        setBooks([]);
        setPage(0);
        setHasMore(true);
    }, [tagId, resolvedUserData?.userId]);

    useEffect(() => {
        if (!resolvedUserData?.userId) return;

        fetchPage(page);
    }, [page, tagId, resolvedUserData?.userId]);

    const fetchPage = async (pageNum: number) => {
        try {
            setLoading(true);

            const limit = 10;
            const offset = pageNum * limit;

            const response = await instance.get(
                `${requests.fetchBooksByTag(
                    tagId
                )}?userId=${resolvedUserData.userId}&limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: accessToken
                            ? `Bearer ${accessToken}`
                            : '',
                    },
                }
            );

            const newBooks: Book[] =
                response.data?.data?.books ?? [];

            setCurrentVisibility(
                response.data?.data?.tagVisibility ??
                    'everyone'
            );

            setBooks((prev) => {
                const ids = new Set(prev.map((b) => b.bookId));

                const filtered = newBooks.filter(
                    (b) => !ids.has(b.bookId)
                );

                return [...prev, ...filtered];
            });

            if (newBooks.length < limit) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch tag books:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPage((prev) => prev + 1);
        }
    }, [loading, hasMore]);

    const updatePrivacy = useCallback(
        async (visibility: Visibility) => {
            try {
                await instance.put(
                    requests.updateShelfPrivacy,
                    {
                        tagId,
                        visibility,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                setCurrentVisibility(visibility);
            } catch (error) {
                console.error(
                    'Failed to update tag privacy',
                    error
                );
            }
        },
        [tagId, accessToken]
    );

    return {
        books,
        loading,
        hasMore,
        currentVisibility,
        loadMore,
        updatePrivacy,
        resolvedUserData,
        isFetchingUser,
        accessToken,
    };
}