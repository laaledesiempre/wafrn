import { Application, Request, Response } from 'express'
import { Op } from 'sequelize'
import sequelize from 'sequelize/lib/sequelize'
import { User, Post } from '../../db.js'
import { environment } from '../../environment.js'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'
import { return404 } from '../../utils/return404.js'

// @ts-ignore cacher has no types
import Cacher from 'cacher'
const cacher = new Cacher()

function wellKnownRoutes(app: Application) {
  // webfinger protocol
  app.get('/.well-known/host-meta', (req: Request, res) => {
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0"><Link rel="lrdd" template="${environment.frontendUrl}/.well-known/webfinger?resource={uri}"/></XRD>`
    )
    res.end()
  })
  app.get('/.well-known/webfinger/', cacher.cache('seconds', 15), async (req: Request, res: Response) => {
    if (req.query?.resource) {
      const urlQueryResource: string = req.query.resource as string
      if (
        urlQueryResource.startsWith('acct:') &&
        (urlQueryResource.endsWith(environment.instanceUrl) ||
          urlQueryResource.startsWith(`acct:${environment.frontendUrl}/fediverse/blog/`))
      ) {
        const userUrl = urlQueryResource.endsWith(environment.instanceUrl)
          ? urlQueryResource.slice(5).slice(0, -(environment.instanceUrl.length + 1))
          : urlQueryResource.slice(`acct:${environment.frontendUrl}/fediverse/blog/`.length)
        const user = await User.findOne({
          where: {
            urlToLower: userUrl.toLowerCase()
          }
        })
        if (!user) {
          return404(res)
          return
        }
        const response = {
          subject: urlQueryResource,
          aliases: [
            `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            `${environment.frontendUrl}/blog/${user.url.toLowerCase()}`
          ],
          links: [
            {
              rel: 'self',
              type: 'application/activity+json',
              href: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`
            },
            {
              rel: 'http://ostatus.org/schema/1.0/subscribe',
              template: `${environment.frontendUrl}/fediverse/authorize_interaction?uri={uri}`
            }
          ]
        }
        res.send(response)
      } else {
        return404(res)
      }
    } else {
      return404(res)
    }
    res.end()
  })

  app.get('/.well-known/nodeinfo', cacher.cache('seconds', 300), (req, res) => {
    res.send({
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: `${environment.frontendUrl}/.well-known/nodeinfo/2.0`
        }
      ]
    })
    res.end()
  })

  app.get('/.well-known/nodeinfo/2.0', cacher.cache('seconds', 300), async (req, res) => {
    const localUsersIds = await getAllLocalUserIds()
    const localUsers = localUsersIds.length
    const activeUsersSixMonths = await Post.count({
      where: {
        userId: { [Op.in]: localUsersIds },
        createdAt: {
          [Op.gt]: new Date().setMonth(-6)
        },
        privacy: 0
      },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']],
      group: ['userId']
    })

    const activeUsersLastMonth = await Post.count({
      where: {
        userId: { [Op.in]: localUsersIds },
        createdAt: {
          [Op.gt]: new Date().setMonth(-1)
        },
        privacy: 0
      },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']],
      group: ['userId']
    })

    res.send({
      version: '2.0',
      software: {
        name: 'wafrn',
        version: '0.1.0'
      },
      protocols: ['activitypub'],
      services: {
        outbound: [],
        inbound: []
      },
      usage: {
        users: {
          total: localUsers,
          activeMonth: activeUsersLastMonth.length,
          activeHalfyear: activeUsersSixMonths.length
        },
        localPosts: await Post.count({
          where: {
            userId: {
              [Op.in]: localUsersIds
            },
            privacy: 0
          }
        })
      },
      openRegistrations: true,
      metadata: {}
    })
    res.end()
  })
}

export { wellKnownRoutes }
