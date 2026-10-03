ALTER TABLE "auth_security"."users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ALTER COLUMN "created_at" SET DEFAULT date_trunc('day', now());--> statement-breakpoint
ALTER TABLE "auth_security"."users" DROP COLUMN "email";