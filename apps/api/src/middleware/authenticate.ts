import OAuth2Server from 'oauth2-server'
import oauthModel from '@services/oauth.model'
import { Request, Response, NextFunction } from 'express'

const oauth = new OAuth2Server({ model: oauthModel })

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const request = new OAuth2Server.Request(req)
  const response = new OAuth2Server.Response(res)
  oauth
    .authenticate(request, response)
    .then((token) => {
      ;(req as any).oauth = token
      next()
    })
    .catch((err) => {
      res.status(err.code || 401).json({ success: false, data: null, error: err.message })
    })
}
