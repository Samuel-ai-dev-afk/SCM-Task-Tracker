import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/authz";

/** Wrap a route handler, translating known errors into JSON responses. */
export async function route<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ZodError) {
      const msg = err.errors[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    /*
      Unexpected failure. The message stays generic on purpose — internal errors
      can name tables and columns — but a short reference is generated so a
      report of "it says something went wrong" can be matched to an exact line
      in the server logs. Without this, a 500 here is indistinguishable from a
      500 anywhere else in the app.
    */
    const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
    console.error(`[${ref}]`, err);
    return NextResponse.json(
      { error: `Something went wrong. Reference ${ref}.` },
      { status: 500 }
    );
  }
}
