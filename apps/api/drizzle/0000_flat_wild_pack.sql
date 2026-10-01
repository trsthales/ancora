CREATE SCHEMA "auth_security";
--> statement-breakpoint
CREATE SCHEMA "recovery_core";
--> statement-breakpoint
CREATE TABLE "auth_security"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_adult" boolean DEFAULT false NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"craving_level" integer NOT NULL,
	"mood" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pseudonym" varchar(50) NOT NULL,
	"avatar_id" varchar(50) DEFAULT 'avatar_default' NOT NULL,
	"persona" varchar(20) NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_pseudonym_unique" UNIQUE("pseudonym")
);
--> statement-breakpoint
ALTER TABLE "recovery_core"."checkins" ADD CONSTRAINT "checkins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_security"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checkins_profile_created" ON "recovery_core"."checkins" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_profiles_last_seen" ON "recovery_core"."profiles" USING btree ("last_seen_at");