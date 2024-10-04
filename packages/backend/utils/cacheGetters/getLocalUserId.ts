import { User, sequelize } from '../../db.js'
import { environment } from '../../environment.js'
import { redisCache } from '../redis.js'

async function getLocalUserId(url: string): Promise<string> {
  let res = ''
  const cacheResult = await redisCache.get('localUserId:' + url)
  if (cacheResult) {
    res = cacheResult
  } else {
    const localUser = await User.findOne({
      attributes: ['id'],
      where: {
        urlToLower: url.toLowerCase()
      }
    })
    if (localUser) {
      res = localUser.id
      await redisCache.set('localUserId:' + url, res)
    }
  }

  return res != ''
    ? res
    : (
      await User.findOne({
        where: {
          urlToLower: environment.deletedUser.toLowerCase()
        }
      })
    ).id
}

export { getLocalUserId }
