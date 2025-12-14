import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TEMPORARIAMENTE DESABILITADO - Middleware causando problemas de autenticação
  // Retornar sem verificação até corrigir a integração com Supabase
  return NextResponse.next()

  /*
  // Pegar token de autenticação do cookie
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get('sb-prlqvvgpgwqmldscgqwa-auth-token')?.value

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Se não estiver autenticado e tentar acessar rota privada
  if (!token && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se estiver autenticado e tentar acessar a página de login
  if (token && req.nextUrl.pathname === '/login') {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
