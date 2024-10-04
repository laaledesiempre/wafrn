import { 
    Emoji,
    ProcessedPost,
    SimplifiedUser
} from "src/app/interfaces";

export interface Reblog {
    user: SimplifiedUser,
    content: ProcessedPost,
    id: string,
    createdAt: Date,
    parentId?: string,
    emojiName?: string,
    emojiReact?: Emoji 
}
