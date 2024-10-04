import { Application, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import { Emoji, Post, PostTag, User, UserEmojiRelation } from '../db.js'
import { sequelize } from '../db.js'

import getStartScrollParam from '../utils/getStartScrollParam.js'
import getPosstGroupDetails from '../utils/getPostGroupDetails.js'
import optionalAuthentication from '../utils/optionalAuthentication.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import { searchRemoteUser } from '../utils/activitypub/searchRemoteUser.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { environment } from '../environment.js'
import { getPostThreadRecursive } from '../utils/activitypub/getPostThreadRecursive.js'
import checkIpBlocked from '../utils/checkIpBlocked.js'
import { getAllLocalUserIds } from '../utils/cacheGetters/getAllLocalUserIds.js'
import { getallBlockedServers } from '../utils/cacheGetters/getAllBlockedServers.js'
import { getUnjointedPosts } from '../utils/baseQueryNew.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import { getUserEmojis } from '../utils/cacheGetters/getUserEmojis.js'
export default function searchRoutes(app: Application) {
  app.get('/api/v2/search/', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    // const success = false;
    // eslint-disable-next-line max-len
    const searchTerm: string = (req.query.term || '').toString().toLowerCase().trim()
    let users: any = []
    let localUsers: any = []

    let postIds: string[] = []
    let remoteUsers: any = []
    let remotePost: any
    const promises: Array<Promise<any>> = []
    const posterId = req.jwtData ? req.jwtData.userId : '00000000-0000-0000-0000-000000000000'

    if (searchTerm) {
      const page = Number(req?.query.page) || 0
      let taggedPostsId = PostTag.findAll({
        where: {
          tagToLower: searchTerm
        },
        include: [
          {
            model: Post,
            required: true,
            attributes: ['id', 'userId', 'privacy'],
            where: {
              [Op.or]: [
                {
                  privacy: { [Op.in]: [0, 2] }
                },
                {
                  userId: {
                    [Op.in]: (await getFollowedsIds(posterId)).concat([posterId])
                  },
                  privacy: 1
                }
              ]
            }
          }
        ],
        attributes: ['postId'],
        order: [['createdAt', 'DESC']],
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage
      })
      promises.push(taggedPostsId)
      localUsers = User.findAll({
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage,
        where: {
          activated: true,
          [Op.and]: [
            {
              url: {
                [Op.notLike]: '@%'
              }
            },
            {
              urlToLower: {
                [Op.like]: `%${searchTerm}%`
              }
            }
          ]
        },
        attributes: ['name', 'url', 'avatar', 'id', 'remoteId', 'description']
      })
      users = User.findAll({
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage,
        where: {
          activated: true,
          url: { [Op.like]: '@%' },
          federatedHostId: {
            [Op.notIn]: await getallBlockedServers()
          },
          banned: false,
          [Op.or]: [
            {
              urlToLower: {
                [Op.like]: `%${searchTerm}%`
              }
            }
          ]
        },
        attributes: ['name', 'url', 'avatar', 'id', 'remoteId', 'description']
      })
      promises.push(users)
      promises.push(localUsers)
      const usr = await User.findByPk(posterId)

      // remote user search time
      if (posterId !== '00000000-0000-0000-0000-000000000000' && page === 0) {
        if (searchTerm.split('@').length === 3) {
          remoteUsers = searchRemoteUser(searchTerm, usr)
          promises.push(remoteUsers)
        }
        const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
        if (searchTerm.match(urlPattern)) {
          const existingPost = await Post.findOne({
            where: {
              remotePostId: searchTerm
            }
          })
          if (existingPost) {
            // We have the post. We ask for an update of it!
            remotePost = getPostThreadRecursive(usr, searchTerm, undefined, existingPost.id)
            promises.push(remotePost)
          } else {
            remotePost = getPostThreadRecursive(usr, searchTerm)
            promises.push(remotePost)
          }
        }
      }

      await Promise.all(promises)
      remotePost = await remotePost
      if (remotePost && remotePost.id) {
        postIds.push(remotePost.id)
      }
      taggedPostsId = await taggedPostsId
      postIds = postIds.concat(taggedPostsId.map((elem: any) => elem.postId))
    }

    const posts = await getUnjointedPosts(postIds, posterId)
    remoteUsers = await remoteUsers
    localUsers = await localUsers
    users = await users

    const foundUsers = [...remoteUsers, ...localUsers, ...users]
    const userIds = foundUsers.map((u: any) => u.id)
    const userEmojiIds = await UserEmojiRelation.findAll({
      attributes: ['emojiId', 'userId'],
      where: {
        userId: {
          [Op.in]: userIds
        }
      }
    })
    const emojiIds = userEmojiIds.map((e: any) => e.emojiId)
    const emojis = await Emoji.findAll({
      attributes: ['id', 'url', 'external', 'name'],
      where: {
        id: {
          [Op.in]: emojiIds
        }
      }
    })

    res.send({
      emojis,
      userEmojiIds,
      foundUsers,
      posts: posts
    })
  })

  app.get('/api/userSearch/:term', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId
    // const success = false;
    let users: any = []
    const searchTerm = req.params.term.toLowerCase().trim()
    users = User.findAll({
      limit: 20,
      where: {
        activated: true,
        url: { [Op.like]: '@%' },
        federatedHostId: {
          [Op.notIn]: await getallBlockedServers()
        },
        banned: false,
        [Op.or]: [
          {
            urlToLower: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      attributes: ['url', 'avatar', 'id', 'remoteId']
    })

    let localUsers = User.findAll({
      limit: 20,
      where: {
        activated: true,
        [Op.and]: [
          {
            url: {
              [Op.notLike]: '@%'
            }
          },
          [
            {
              urlToLower: {
                [Op.like]: `%${searchTerm}%`
              }
            }
          ]
        ]
      },
      attributes: ['url', 'avatar', 'id', 'remoteId']
    })
    await Promise.all([localUsers, users])
    users = await users
    localUsers = await localUsers
    const result = localUsers
      .concat(users)
      .concat(await searchRemoteUser(searchTerm, await User.findOne({ where: { id: posterId } })))
    res.send({
      users: result
    })
  })
}
