import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", issues: error.issues }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
}
