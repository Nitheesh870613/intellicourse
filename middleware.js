import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Wrap Clerk middleware with error handling for production safety
function errorHandlingMiddleware(request) {
  try {
    return clerkMiddleware()(request);
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export default errorHandlingMiddleware;

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
