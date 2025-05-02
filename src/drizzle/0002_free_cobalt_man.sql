CREATE TABLE "steps" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"step_type" text NOT NULL,
	"text" text,
	"reasoning" text,
	"finish_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tool_calls" json,
	"tool_results" json
);
--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reasoning" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tool_calls" json;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tool_results" json;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "has_tool_use" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;