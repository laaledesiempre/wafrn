import { Emoji } from "src/app/interfaces"

export interface EmojiCollection{
    name: string,
    emojis: Emoji[],
    comment: string
  }