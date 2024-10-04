import { Op } from 'sequelize'
import { Blocks, Follows, User } from '../db.js'
import { logger } from './logger.js'
import { Response } from 'express'
import { remoteFollow } from './activitypub/remoteFollow.js'
import { redisCache } from './redis.js'

async function follow(followerId: string, followedId: string, petition?: Response): Promise<boolean> {
  let res = false
  try {
    const userFollowed = await User.findOne({
      where: {
        id: followedId
      }
    })
    const blocksExisting = await Blocks.count({
      where: {
        [Op.or]: [
          {
            blockerId: followerId,
            blockedId: { [Op.in]: [followedId] }
          },
          {
            blockedId: followerId,
            blockerId: { [Op.in]: [followedId] }
          }
        ]
      }
    })
    if (blocksExisting > 0) {
      if (petition) {
        petition.sendStatus(500)
        petition.send({
          error: true,
          message: 'You can not follow someone who you have blocked, nor who has blocked you'
        })
      }
      res = false
      return res
    }
    const existingFollow = await Follows.findOne({
      where: {
        followerId: followerId,
        followedId: userFollowed.id
      }
    })
    if (!existingFollow) {
      const follow = await Follows.create({
        followerId: followerId,
        followedId: userFollowed.id,
        accepted: userFollowed.url.startsWith('@') ? false : !userFollowed.manuallyAcceptsFollows
      })
      if (userFollowed.remoteId) {
        res = true
        const localUser = await User.findOne({ where: { id: followerId } })
        remoteFollow(localUser, userFollowed)
          .then((response) => {
            redisCache.del('follows:full:' + followerId)
            redisCache.del('follows:local:' + followerId)
            redisCache.del('follows:notYetAcceptedFollows:' + followerId)
          })
          .catch(async (error) => {
            logger.info('error following remote user')
            await follow.destroy()
            // TODO INFORM USER ABOUT THE ISSUE
          })
      }
    }
    res = true
    redisCache.del('follows:full:' + followerId)
    redisCache.del('follows:local:' + followerId)
    redisCache.del('follows:notYetAcceptedFollows:' + followerId)
  } catch (error) {
    logger.error(error)
    res = false
  }
  return res
}

export { follow }
