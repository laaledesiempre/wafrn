import { SimplifiedUser } from "./simplified-user";
//( TODO imports form interfacaezs
export interface followsResponse  extends SimplifiedUser{
    follows: {

        remoteFollowId?: any;
      
        accepted: boolean;
      
        createdAt: string;
      
        updatedAt: string;
      
        followerId: string;
      
        followedId: string;
      
      }
}