import {NextRequest, NextResponse} from 'next/server'

const publicPaths = [
    '/auth/login',
    '/api/auth/login',
    '/api/captcha',
]

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl

    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith(path + '/')
    )

    const token = request.cookies.get('access_token_cookie')?.value

    const isAuthenticated = !!token

    if (isAuthenticated && isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (!isAuthenticated && !isPublicPath) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
}

// 控制 middleware 在哪些路径上运行（性能优化），排除 _next、静态资源、图片、api 等
export const config = {
    matcher: [
        /*
         * 匹配所有路径，但排除：
         * - api 路由
         * - _next/static (静态文件)
         * - _next/image (图片优化)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}