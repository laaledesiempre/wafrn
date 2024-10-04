import { SimplifiedUser } from "src/app/interfaces";

export interface Ask {
    id: string
    userAsker: string,
    question: string,
    apObject: string,
    user?: SimplifiedUser,
    postId?: string

}
