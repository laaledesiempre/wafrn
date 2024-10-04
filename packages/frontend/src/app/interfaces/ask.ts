import { SimplifiedUser } from "./simplified-user";
// TODO imports interfaces
export interface Ask {
    id: string
    userAsker: string,
    question: string,
    apObject: string,
    user?: SimplifiedUser,
    postId?: string

}
