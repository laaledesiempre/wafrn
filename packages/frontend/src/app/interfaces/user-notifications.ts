import { NotificationType } from '../enums/notification-type';
import { 
  Emoji,
  ProcessedPost,
} from "src/app/interfaces"

export interface UserNotifications {
  url: string;
  avatar: string;
  userUrl: string;
  date: Date;
  type: NotificationType;
  emojiReact?: Emoji;
  emojiName?: string;
  fragment?: ProcessedPost
}
