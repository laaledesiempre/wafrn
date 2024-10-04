import { ProcessedPost } from './processed-post';
// TODO imports from interfaces
export enum Action {
    None,
    New,
    Response,
    Close
}

export interface EditorLauncherData {
    action: Action,
    post?: ProcessedPost
}