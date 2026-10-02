CREATE TABLE "auth_security"."consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"terms_version" varchar(20) NOT NULL,
	"privacy_policy_version" varchar(20) NOT NULL,
	"health_data_consent" boolean DEFAULT true NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth_security"."consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_security"."users"("id") ON DELETE cascade ON UPDATE no action;