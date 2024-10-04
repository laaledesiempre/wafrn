import { 
  Emoji
} from 'src/app/interfaces';

export interface SimplifiedUser {
  avatar: string;
  url: string;
  name: string;
  id: string;
  remoteId?: string;
  description?: string;
  emojis?: Emoji[];
  email?: string;
}
