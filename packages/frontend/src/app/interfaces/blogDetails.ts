import { Emoji } from "./emoji";
import { FederatedHost } from "./federatedHost";
import { PublicOption } from "./publicOption";
// TODO imports from interfaces
export interface BlogDetails {

    id: string;

    url: string;

    name: string;

    createdAt: string;

    description: string;

    remoteId: string;

    avatar: string;

    federatedHostId: string;

    headerImage: string;

    followingCount: number;

    followerCount: number;

    manuallyAcceptsFollows: boolean;

    emojis: Emoji[];

    federatedHost?: FederatedHost;

    muted: boolean;

    blocked: boolean;

    serverBlocked: boolean;

    followed: number;

    followers: number;

    publicOptions: PublicOption[];

}