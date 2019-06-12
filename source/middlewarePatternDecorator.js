/*** Function wrapped middleware pattern - the middleware is wrapped with a function and accepts option arguments */
export function functionWrappedMiddlewareDecorator(func) {
  return new Proxy(func, {
    apply: (target, thisArg, argumentsList) => {
      let middleware = async (context, next) => {
        await target.apply(thisArg, [context, next, ...argumentsList])
      }
      return middleware // returns a middleware after creating a context for argumentsList
    },
  })
}
