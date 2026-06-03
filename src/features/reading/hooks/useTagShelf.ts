import { useCallback, useEffect, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useShelfUser } from './useShelfUser';
import { Book, ShelfUser, Visibility } from '../types';

interface UseTagShelfOptions {
    tagId: number;
    userData?: ShelfUser;
    accessToken: string;
    username?: string;
    isCollaborative: boolean;
    metaLoaded: boolean;
}

export function useTagShelf({
    tagId,
    userData,
    accessToken,
    isCollaborative,
    metaLoaded,
}: UseTagShelfOptions) {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const [currentVisibility, setCurrentVisibility] =
        useState<Visibility>('everyone');

    const fetchPage = useCallback(async (pageNum: number) => {
        if (pageNum === 0) {
          setInitialLoaded(true);
        }
        try {
            setLoading(true);

            const limit = 10;
            const offset = pageNum * limit;

           const response = isCollaborative
            ? await instance.get(
                requests.getCollaborativeBooks(
                    tagId.toString()
                ),
                {
                    headers: {
                        Authorization: accessToken
                            ? `Bearer ${accessToken}`
                            : '',
                    },
                    params: {
                        limit,
                        offset,
                    },
                }
            )
            : await instance.get(
                requests.fetchBooksByTag(tagId),
                {
                    headers: {
                        Authorization: accessToken
                            ? `Bearer ${accessToken}`
                            : '',
                    },
                    params: {
                        userId:
                            userData?.userId,
                        limit,
                        offset,
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
        },[
            tagId,
            accessToken,
            userData?.userId,
            isCollaborative,
        ]
    );

    useEffect(() => {
        setBooks([]);
        setPage(0);
        setHasMore(true);
    }, [tagId, userData?.userId, isCollaborative]);

    useEffect(() => {
         if (!isCollaborative && !userData?.userId) {
            return;
        }

        fetchPage(page);
    }, [page, tagId, userData?.userId, metaLoaded, isCollaborative, fetchPage]);

    const loadMore = useCallback(() => {
        if (!initialLoaded) return;
        if (!loading && hasMore) {
            setPage((prev) => prev + 1);
        }
    }, [initialLoaded, loading, hasMore]);

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

    const refreshBooks = useCallback(() => {
        setBooks([]);
        setHasMore(true);

        if (page === 0) {
            fetchPage(0);
        } else {
            setPage(0);
        }
    }, [page, fetchPage]);

    return {
        books,
        loading,
        hasMore,
        currentVisibility,
        loadMore,
        updatePrivacy,
        refreshBooks,
    };
}