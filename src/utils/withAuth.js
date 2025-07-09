import { verifyAuth } from "./verifyAuth";
import { NextResponse } from "next/server";

export function withAuth(handler) {
  return async function (req) {
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    return handler(req, authResult.decoded);
  };
}
