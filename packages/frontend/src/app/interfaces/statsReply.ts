import {
 bullMQMetric 
} from 'src/app/interfaces';

export interface statsReply {
  sendPostFailed: bullMQMetric;
  sendPostSuccess: bullMQMetric;
  prepareSendFail: bullMQMetric;
  prepareSendSuccess: bullMQMetric;
  inboxFail: bullMQMetric;
  inboxSuccess: bullMQMetric;
  updateUserFail: bullMQMetric;
  updateUserSuccess: bullMQMetric;
  sendPostAwaiting: number;
  prepareSendPostAwaiting: number;
  inboxAwaiting: number;
  updateUserAwaiting: number;
  deletePostAwaiting: number;
}
