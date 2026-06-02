import { useCallback, useEffect, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useShelfUser } from './useShelfUser';
import { Book, ShelfUser, Visibility } from '../types';

interface UseStatusShelfOptions {
    status: string;
    userData?: ShelfUser;
    username?: string;
}

export function useStatusShelf({
    status,
    userData,
    username,
}: UseStatusShelfOptions) {
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
    }, [status, resolvedUserData?.userId]);

    useEffect(() => {
        if (!resolvedUserData?.userId) return;

        fetchPage(page);
    }, [page, status, resolvedUserData?.userId]);

    const fetchPage = async (pageNum: number) => {
        try {
            setLoading(true);

            const limit = 10;
            const offset = pageNum * limit;

            const query = new URLSearchParams({
                userId: String(resolvedUserData.userId),
                status,
                limit: String(limit),
                offset: String(offset),
            });

            const response = await instance(
                `${requests.fetchBookShelf}?${query}`,
                {
                    headers: {
                        Authorization: accessToken
                            ? `Bearer ${accessToken}`
                            : '',
                    },
                }
            );

            const newBooks: Book[] =
                response.data?.data?.userBooks ?? [];

            setCurrentVisibility(
                response.data?.data?.shelfVisibility ??
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
            console.error('Failed to fetch shelf books:', error);
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
                        shelfType: status,
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
                    'Failed to update shelf privacy',
                    error
                );
            }
        },
        [status, accessToken]
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