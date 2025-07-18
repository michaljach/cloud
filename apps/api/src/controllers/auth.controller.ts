import { Request, Response } from 'express'
import OAuth2Server from 'oauth2-server'
import oauthModel from '../services/oauth.model'

const oauth = new OAuth2Server({ model: oauthModel })

export const authorize = (req: Request, res: Response, next: any) => {
  const request = new OAuth2Server.Request(req)
  const response = new OAuth2Server.Response(res)
  oauth
    .authorize(request, response)
    .then((code) => {
      res.json(code)
    })
    .catch(next)
}

export const token = (req: Request, res: Response, next: any) => {
  const request = new OAuth2Server.Request(req)
  const response = new OAuth2Server.Response(res)
  oauth
    .token(request, response)
    .then((token) => {
      res.json(token)
    })
    .catch(next)
}
