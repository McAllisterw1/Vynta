import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_USER_ID;
    if (!adminId || !userId || userId !== adminId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|tgz|gz|bz2?|ttf|eot|svg|webp|png|jpe?g|gif|ico|avif|wasm)$)[^?]*)",
    "/(api|trpc)(.*)",
  ],
};
