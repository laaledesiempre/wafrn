import { SimplifiedUser } from "./simplified-user";
import { WafrnMedia } from "./wafrn-media";
import { Tag } from "./tag";
import { WafrnMention } from "./wafrn-mention";
import { Emoji } from "./emoji";
import { QuestionPoll } from "./questionPoll";
// TODO import from interfaces
export interface RawPost {
    id:             string;
    content_warning:           string;
    content:        string;
    createdAt:      Date;
    updatedAt:      Date;
    userId:         string;
    hierarchyLevel: number;
    ancestors?:     RawPost[];
    descendents?:   RawPost[];
    user:           SimplifiedUser;
    medias?:        WafrnMedia[];
    postTags:           Tag[];
    mentionPost?: SimplifiedUser[];
    notes:          number;
    privacy:        number;
    remotePostId?:   string;
    userLikesPostRelations: {userId: string}[];
    emojis:         Array<Emoji>;
    questionPoll?: QuestionPoll;


}
