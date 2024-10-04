import {
    SimplifiedUser,
    WafrnMedia,
    Tag,
    Emoji,
    QuestionPoll
} from "src/app/interfaces"

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
