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
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
