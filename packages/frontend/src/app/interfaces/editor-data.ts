import { Ask } from "./ask";
import { ProcessedPost } from "./processed-post";
// imports from interfaces
export interface EditorData {
    scrollDate: Date,
    path: string,
    ask?: Ask,
    post?: ProcessedPost,
    quote?: ProcessedPost,
    edit?: boolean
}
