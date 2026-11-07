import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appState } from "../../db/schema.js";
import { handle, initialState, tick } from "../lib/laundry.js";

const STATE_ID = 1;

export default async (req: Request) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const isStatus = route === "status";

  if (!isStatus && req.method !== "POST") {
    return Response.json({ success: false, message: "Method not allowed" }, { status: 405 });
  }

  let body: any = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
    }
  }

  const adminPassword = Netlify.env.get("ADMIN_PASSWORD") || "admin123";

  try {
    const result = await db.transaction(async (tx) => {
      await tx.insert(appState).values({ id: STATE_ID, data: initialState() }).onConflictDoNothing();
      const [row] = await tx.select().from(appState).where(eq(appState.id, STATE_ID)).for("update");
      const data: any = row.data;

      const before = JSON.stringify(data);
      tick(data);
      const res = isStatus ? { status: 200, body: data } : handle(route, data, body, adminPassword);

      if (JSON.stringify(data) !== before) {
        await tx.update(appState).set({ data, updatedAt: new Date() }).where(eq(appState.id, STATE_ID));
      }
      return res;
    });

    return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/*",
};
