ALTER TABLE "audit_log" ALTER COLUMN "actor_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "encounters" ALTER COLUMN "assigned_to" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "assigned_user_id" SET DATA TYPE text;