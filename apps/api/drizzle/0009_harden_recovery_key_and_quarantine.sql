ALTER TABLE "recovery_core"."quarantined_pseudonyms" ADD COLUMN "account_token" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_recovery_key_hash" ON "auth_security"."users" USING btree ("recovery_key_hash");--> statement-breakpoint
CREATE INDEX "idx_quarantined_account_token" ON "recovery_core"."quarantined_pseudonyms" USING btree ("account_token");--> statement-breakpoint
ALTER TABLE "auth_security"."users" ADD CONSTRAINT "users_recovery_key_hash_unique" UNIQUE("recovery_key_hash");