import { ProcessedPost } from "src/app/interfaces"

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