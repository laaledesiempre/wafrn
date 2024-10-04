import { Job, Queue, QueueEvents } from 'bullmq'
import { User } from '../../db.js'
import { environment } from '../../environment.js'

import { logger } from '../logger.js'
import { getUserIdFromRemoteId } from '../cacheGetters/getUserIdFromRemoteId.js'

const deletedUser = environment.forceSync
  ? undefined
  : User.findOne({
    where: {
      url: environment.deletedUser
    }
  })
const queue = new Queue('getRemoteActorId', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})
const queueEvents = new QueueEvents('getRemoteActorId', {
  connection: environment.bullmqConnection
})
async function getRemoteActor(actorUrl: string, user: any, forceUpdate = false): Promise<any> {
  let remoteUser
  try {
    // we check its a string. A little bit dirty but could be worse
    if (actorUrl.toLowerCase().startsWith(environment.frontendUrl + '/fediverse/blog/')) {
      const urlToSearch = actorUrl.split(environment.frontendUrl + '/fediverse/blog/')[1].toLowerCase()
      return User.findOne({
        where: {
          urlToLower: urlToSearch
        }
      })
    }
    let userId = await getUserIdFromRemoteId(actorUrl)
    if (userId === '') {
      const job = await queue.add('getRemoteActorId', { actorUrl: actorUrl, userId: user.id, forceUpdate: forceUpdate })
      userId = await job.waitUntilFinished(queueEvents).catch((error) => {
        logger.debug({
          message: `Error while geting user`,
          user: actorUrl,
          by: user.id,
          error: error
        })
      })
    }
    remoteUser = await User.findByPk(userId)
    if (
      !remoteUser ||
      (remoteUser && remoteUser.banned) ||
      (remoteUser && (await remoteUser.getFederatedHost()).blocked)
    ) {
      remoteUser = await deletedUser
    }
  } catch (error) {
    logger.trace({
      message: `Error fetching user ${actorUrl}`,
      error: error
    })
  }
  // update user if last update was more than 24 hours ago
  if (remoteUser && remoteUser.url !== environment.deletedUser) {
    const lastUpdate = new Date(remoteUser.updatedAt)
    const now = new Date()
    if (now.getTime() - lastUpdate.getTime() > 24 * 3600 * 1000 || forceUpdate) {
      await queue.add(
        'getRemoteActorId',
        { actorUrl: actorUrl, userId: user.id, forceUpdate: true },
        {
          jobId: actorUrl.replaceAll(':', '_').replaceAll('/', '_')
        }
      )
    }
  }
  return remoteUser ? remoteUser : deletedUser
}

export { getRemoteActor }
