import { Op, Sequelize } from 'sequelize'
import { logger } from '../logger.js'
import { postPetitionSigned } from '../activitypub/postPetitionSigned.js'
import { postToJSONLD } from '../activitypub/postToJSONLD.js'
import { LdSignature } from '../activitypub/rsa2017.js'
import { FederatedHost, Post, User, PostHostView, RemoteUserPostView, sequelize } from '../../db.js'
import { environment } from '../../environment.js'
import { Job, Queue } from 'bullmq'
import _ from 'underscore'
import { wait } from '../wait.js'

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 25000
    },
    removeOnFail: 25000
  }
})
async function prepareSendRemotePostWorker(job: Job) {
  // TODO fix this! this is dirtier than my unwashed gim clothes
  await wait(1500)
  //async function sendRemotePost(localUser: any, post: any) {
  const post = await Post.findOne({
    where: {
      id: job.id
    }
  })
  const localUser = await User.findOne({
    where: {
      id: post.userId
    }
  })

  // servers with shared inbox
  let serversToSendThePost
  const localUserFollowers = await localUser.getFollower()
  const followersServers = [...new Set(localUserFollowers.map((el: any) => el.federatedHostId))]
  // for servers with no shared inbox
  let usersToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.eq]: null },
      blocked: false
    },
    include: [
      {
        required: true,
        model: User,
        attributes: ['remoteInbox', 'id'],
        where: {
          banned: false,
          id: {
            [Op.in]: (await localUser.getFollower()).map((usr: any) => usr.id)
          }
        }
      }
    ]
  })
  // mentioned users
  const mentionedUsers = await post.getMentionPost()
  switch (post.privacy) {
    case 2: {
      break
    }
    case 10: {
      serversToSendThePost = []
      usersToSendThePost = []
      break
    }
    default: {
      serversToSendThePost = await FederatedHost.findAll({
        where: {
          publicInbox: { [Op.ne]: null },
          blocked: { [Op.ne]: true },
          [Op.or]: [
            {
              id: {
                [Op.in]: followersServers
              }
            },
            {
              friendServer: true
            }
          ]
        }
      })
    }
  }

  // before sending we store the fact that we have sent the post
  await PostHostView.bulkCreate(
    serversToSendThePost.map((host: any) => {
      return {
        federatedHostId: host.id,
        postId: post.id
      }
    })
  )

  let userViews = usersToSendThePost
    .flatMap((usr: any) => usr.users)
    .map((elem: any) => {
      return {
        userId: elem.id,
        postId: post.id
      }
    })
    .concat(
      mentionedUsers.map((elem: any) => {
        return {
          userId: elem.id,
          postId: post.id
        }
      })
    )
  userViews = userViews.filter(
    (elem: any, index: number) => userViews.indexOf(userViews.find((fnd: any) => fnd.userId == elem.userId)) == index
  )

  await RemoteUserPostView.bulkCreate(userViews)

  const objectToSend = await postToJSONLD(post.id)
  const ldSignature = new LdSignature()
  const bodySignature = await ldSignature.signRsaSignature2017(
    objectToSend,
    localUser.privateKey,
    `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLocaleLowerCase()}`,
    environment.instanceUrl,
    new Date(post.createdAt)
  )

  const objectToSendComplete = { ...objectToSend, signature: bodySignature.signature }
  if (mentionedUsers?.length > 0) {
    const mentionedInboxes = mentionedUsers.map((elem: any) => elem.remoteInbox)
    for await (const remoteInbox of mentionedInboxes) {
      try {
        const response = await postPetitionSigned(objectToSendComplete, localUser, remoteInbox)
      } catch (error) {
        logger.debug(error)
      }
    }
  }

  if (serversToSendThePost?.length > 0 || usersToSendThePost?.length > 0) {
    let inboxes: string[] = []
    inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
    usersToSendThePost?.forEach((server: any) => {
      inboxes = inboxes.concat(server.users.map((elem: any) => elem.remoteInbox))
    })
    const addSendPostToQueuePromises: Promise<any>[] = []
    logger.debug(`Preparing send post. ${inboxes.length} inboxes`)
    for (const inboxChunk of inboxes) {
      addSendPostToQueuePromises.push(
        sendPostQueue.add(
          'sencChunk',
          {
            objectToSend: objectToSendComplete,
            petitionBy: localUser.dataValues,
            inboxList: inboxChunk
          },
          {
            priority: 1
          }
        )
      )
    }
    await Promise.allSettled(addSendPostToQueuePromises)
  }
}

export { prepareSendRemotePostWorker }
