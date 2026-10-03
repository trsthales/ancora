ALTER TABLE "auth_security"."consents" ALTER COLUMN "health_data_consent" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ALTER COLUMN "last_seen_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ALTER COLUMN "last_seen_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_security"."users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_refresh_token_hash" ON "auth_security"."sessions" USING btree ("refresh_token_hash");