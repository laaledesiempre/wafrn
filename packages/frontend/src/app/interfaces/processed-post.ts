import {
  SimplifiedUser,
  WafrnMedia,
  Tag,
  Emoji,
  RawPost,
  QuestionPoll,
  PostEmojiReaction,
  Ask
} from "src/app/interfaces"

export interface ProcessedPost {
  id: string;
  content_warning: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: SimplifiedUser;
  medias?: WafrnMedia[];
  tags: Tag[];
  mentionPost?: SimplifiedUser[];
  notes: number;
  privacy: number;
  remotePostId: string;
  userLikesPostRelations: string[];
  emojis: Emoji[];
  descendents: RawPost[];
  questionPoll?: QuestionPoll;
  emojiReactions: PostEmojiReaction[];
  quotes: ProcessedPost[];
  parentId?: string,
  ask?: Ask
}
