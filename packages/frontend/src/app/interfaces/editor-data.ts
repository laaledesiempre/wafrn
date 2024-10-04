import { Ask, ProcessedPost } from "src/app/interfaces"

export interface EditorData {
    scrollDate: Date,
    path: string,
    ask?: Ask,
    post?: ProcessedPost,
    quote?: ProcessedPost,
    edit?: boolean
}
