import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

// Whole laundry state (machines, racks, queues, admin) stored as a single JSON document row.
export const appState = pgTable("app_state", {
  id: integer().primaryKey(),
  data: jsonb().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
