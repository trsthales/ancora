CREATE TABLE "recovery_core"."quarantined_pseudonyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pseudonym" varchar(50) NOT NULL,
	"quarantined_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quarantined_pseudonyms_pseudonym_unique" UNIQUE("pseudonym")
);
--> statement-breakpoint
ALTER TABLE "auth_security"."sessions" ADD COLUMN "rotated_to_session_id" uuid;