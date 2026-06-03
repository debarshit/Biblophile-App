import { useState, useCallback, useEffect } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

import { DEFAULT_LIST_SETTINGS } from '../components/collaborativeList/Constants';
import { Membership, Tab } from '../types';

export function useCollabTagShelf({
    tagId,
    accessToken,
}: {
    tagId: number;
    accessToken: string;
}) {
    const [activeTab, setActiveTab] = useState<Tab>('books');

    const [metaLoaded, setMetaLoaded] = useState(false);

    const [isCollaborative, setIsCollaborative] =
        useState(false);

    const [listSettings, setListSettings] =
        useState(DEFAULT_LIST_SETTINGS);

    const [myMembership, setMyMembership] =
        useState<Membership | null>(null);

    const [loadingMeta, setLoadingMeta] =
        useState(false);

    const [enablingCollab, setEnablingCollab] =
        useState(false);

    const [enableCollabError, setEnableCollabError] =
        useState('');

    const fetchMeta = useCallback(async () => {
        if (!tagId) return;
        if (!accessToken) return;
        try {
            setLoadingMeta(true);

            const response = await instance.get(
                requests.getListMeta(tagId.toString()),
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const meta = response.data?.data;

            setIsCollaborative(
                meta?.isCollaborative ?? false
            );

            setListSettings(
                meta?.listSettings ??
                    DEFAULT_LIST_SETTINGS
            );

            setMyMembership(
                meta?.myMembership ?? null
            );
        } catch (error) {
            console.error(
                'Failed to fetch collaborative metadata',
                error
            );
        } finally {
            setMetaLoaded(true);
            setLoadingMeta(false);
        }
    }, [tagId, accessToken]);

    useEffect(() => {
        setActiveTab('books');

        setMetaLoaded(false);
        setIsCollaborative(false);

        setListSettings(
            DEFAULT_LIST_SETTINGS
        );

        setMyMembership(null);

        fetchMeta();
    }, [fetchMeta]);

    const enableCollaboration =
        useCallback(async () => {
            try {
                setEnablingCollab(true);
                setEnableCollabError('');

                await instance.post(
                    requests.enableCollaborativeList(
                        tagId.toString()
                    ),
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                setIsCollaborative(true);

                setMyMembership({
                    role: 'owner',
                    status: 'accepted',
                });

                await fetchMeta();

                return true;
            } catch (error: any) {
                const message =
                    error?.response?.data?.message ??
                    'Could not enable collaboration right now.';

                setEnableCollabError(message);

                return false;
            } finally {
                setEnablingCollab(false);
            }
        }, [
            tagId,
            accessToken,
            fetchMeta,
        ]);

    const saveSettings = useCallback(
        async (
            patch: Partial<
                typeof DEFAULT_LIST_SETTINGS
            >
        ) => {
            try {
                await instance.patch(
                    requests.updateListSettings(
                        tagId.toString()
                    ),
                    patch,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                setListSettings((prev) => ({
                    ...prev,
                    ...patch,
                }));

                return true;
            } catch (error) {
                console.error(
                    'Failed to save settings',
                    error
                );

                return false;
            }
        },
        [tagId, accessToken]
    );

    const joinRequest = useCallback(
        async () => {
            try {
                await instance.post(
                    requests.requestToJoin(
                        tagId.toString()
                    ),
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                setMyMembership({
                    role:
                        listSettings.joinPolicy ===
                        'open'
                            ? listSettings.defaultMemberRole
                            : 'viewer',

                    status:
                        listSettings.joinPolicy ===
                        'open'
                            ? 'accepted'
                            : 'pending',

                    initiatedBy: 'member',
                });

                return true;
            } catch (error) {
                console.error(
                    'Failed to join list',
                    error
                );

                return false;
            }
        },
        [
            tagId,
            accessToken,
            listSettings,
        ]
    );

    const cancelRequest = useCallback(
        async () => {
            try {
                await instance.delete(
                    requests.cancelPendingAction(
                        tagId.toString()
                    ),
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                setMyMembership(null);

                return true;
            } catch (error) {
                console.error(
                    'Failed to cancel request',
                    error
                );

                return false;
            }
        },
        [tagId, accessToken]
    );

    const isMember =
        myMembership?.status === 'accepted';

    const isOwner =
        myMembership?.role === 'owner';

    const canEdit =
        isOwner ||
        (isMember &&
            myMembership?.role === 'editor');

    return {
        activeTab,
        setActiveTab,

        metaLoaded,
        loadingMeta,

        isCollaborative,

        listSettings,
        myMembership,

        isMember,
        isOwner,
        canEdit,

        enablingCollab,
        enableCollabError,

        setMyMembership,
        setListSettings,

        refreshMeta: fetchMeta,

        enableCollaboration,
        saveSettings,

        joinRequest,
        cancelRequest,
    };
}