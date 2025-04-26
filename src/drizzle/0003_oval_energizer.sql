ALTER TABLE "steps" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "steps" CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tool_calls" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tool_results" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "step_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "finish_reason" text;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "has_tool_use";