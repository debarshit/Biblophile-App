import { useEffect, useMemo, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { ShelfUser } from '../types';

interface UseShelfUserOptions {
    userData?: ShelfUser;
    username?: string;
}

export function useShelfUser({
    userData,
    username,
}: UseShelfUserOptions) {
    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails?.[0]?.accessToken;

    const [localUserData, setLocalUserData] =
        useState<ShelfUser | null>(userData ?? null);

    const [isFetchingUser, setIsFetchingUser] = useState(
        !userData && !!username
    );

    const resolvedUserData = useMemo(
        () => localUserData ?? userData,
        [localUserData, userData]
    );

    useEffect(() => {
        if (localUserData || !username) {
            setIsFetchingUser(false);
            return;
        }

        let cancelled = false;

        const fetchUser = async () => {
            try {
                setIsFetchingUser(true);

                const response = await instance(
                    requests.fetchUserDataFromUsername(username),
                    {
                        headers: {
                            Authorization: accessToken
                                ? `Bearer ${accessToken}`
                                : '',
                        },
                    }
                );

                if (!cancelled) {
                    setLocalUserData(response.data?.data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                if (!cancelled) {
                    setIsFetchingUser(false);
                }
            }
        };

        fetchUser();

        return () => {
            cancelled = true;
        };
    }, [username, accessToken, localUserData]);

    return {
        accessToken,
        resolvedUserData,
        isFetchingUser,
    };
}