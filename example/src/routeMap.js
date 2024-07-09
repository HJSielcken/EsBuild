import { asRouteMap } from '@kaliber/routing'

export const routeMap = asRouteMap({
  root: {
    path: '',
    data: { title: 'Root' }
  },
  home: {
    path: 'home',
    data: { title: 'Home' }
  },
  notFound: {
    path: '*',
    data: {
      status: 404,
      title: '404',
    }
  }
})
