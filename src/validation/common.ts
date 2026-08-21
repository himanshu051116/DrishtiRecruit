import { z } from "zod";

export const HttpUrlSchema = z.string().url().refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}, "Only http:// and https:// URLs are allowed");

export const OptionalHttpUrlSchema = HttpUrlSchema.or(z.literal(""));
