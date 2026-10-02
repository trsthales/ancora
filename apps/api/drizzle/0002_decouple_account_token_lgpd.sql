ALTER TABLE "recovery_core"."profiles" DROP CONSTRAINT "profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ADD COLUMN "account_token" varchar(64) NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_profiles_account_token" ON "recovery_core"."profiles" USING btree ("account_token");--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ADD CONSTRAINT "profiles_account_token_unique" UNIQUE("account_token");