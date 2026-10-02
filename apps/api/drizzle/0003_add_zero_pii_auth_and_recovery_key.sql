ALTER TABLE "auth_security"."users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_security"."users" ADD COLUMN "login_token" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_security"."users" ADD COLUMN "recovery_key_hash" varchar(64) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_login_token" ON "auth_security"."users" USING btree ("login_token");--> statement-breakpoint
ALTER TABLE "auth_security"."users" ADD CONSTRAINT "users_login_token_unique" UNIQUE("login_token");