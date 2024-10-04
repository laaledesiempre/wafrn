import express, { Response } from 'express'
import cors from 'cors'
import { activityPubRoutes } from './routes/activitypub/activitypub.js'
import { wellKnownRoutes } from './routes/activitypub/well-known.js'
import { environment } from './environment.js'
import overrideContentType from './utils/overrideContentType.js'
import { logger } from './utils/logger.js'
import bodyParser from 'body-parser'
import { SignedRequest } from './interfaces/fediverse/signedRequest.js'
import checkIpBlocked from './utils/checkIpBlocked.js'

const PORT = environment.fediPort
const app = express()
app.use(cors())
app.use(checkIpBlocked)
app.use(overrideContentType)
app.set('trust proxy', 1)
app.use(
  bodyParser.json({
    limit: '50mb',
    verify: (req: SignedRequest, res, buf) => {
      req.rawBody = buf.toString()
    }
  })
)

app.use('/contexts', express.static('contexts'))
activityPubRoutes(app)
wellKnownRoutes(app)

app.listen(PORT, environment.listenIp, () => {
  logger.info('Started fedi listener')
})
