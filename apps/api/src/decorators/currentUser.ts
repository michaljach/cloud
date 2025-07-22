import { createParamDecorator, HttpError } from 'routing-controllers'

/**
 * Custom decorator to inject the authenticated user from the request.
 *
 * @function
 * @returns {ParameterDecorator} A parameter decorator that injects the authenticated user from the request context.
 * @throws {HttpError} Throws a 401 error if the user is not authenticated.
 *
 * @example
 * // In a controller method:
 * @Get('/me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * The user object is expected to be attached to the request as `request.oauth.user`.
 */
export function CurrentUser() {
  return createParamDecorator({
    required: true,
    value: (action) => {
      const user = (action.request as any).oauth?.user
      if (!user) throw new HttpError(401, 'Not authenticated')
      return user
    }
  })
}
