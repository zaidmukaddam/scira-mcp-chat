CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;