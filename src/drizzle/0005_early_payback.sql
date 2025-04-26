ALTER TABLE "messages" ADD COLUMN "parts" json NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "content";