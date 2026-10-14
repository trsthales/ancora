CREATE TABLE "recovery_core"."daily_metrics" (
	"metric_date" date NOT NULL,
	"metric_name" varchar(50) NOT NULL,
	"metric_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_metrics_metric_date_metric_name_pk" PRIMARY KEY("metric_date","metric_name")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."daily_post_limits" (
	"profile_id" uuid NOT NULL,
	"post_date" date NOT NULL,
	"post_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "daily_post_limits_profile_id_post_date_pk" PRIMARY KEY("profile_id","post_date")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."my_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"chip_id" varchar(32) NOT NULL,
	"category" varchar(20) NOT NULL,
	"saved_at" timestamp with time zone DEFAULT date_trunc('day', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."post_saves" (
	"post_id" uuid NOT NULL,
	"save_token" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT date_trunc('day', now()) NOT NULL,
	CONSTRAINT "post_saves_post_id_save_token_pk" PRIMARY KEY("post_id","save_token")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."post_supports" (
	"post_id" uuid NOT NULL,
	"reaction_token" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT date_trunc('day', now()) NOT NULL,
	CONSTRAINT "post_supports_post_id_reaction_token_pk" PRIMARY KEY("post_id","reaction_token")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."profile_notification_counters" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"unread_supports" integer DEFAULT 0 NOT NULL,
	"unread_inspirations" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."triad_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"category" varchar(10) NOT NULL,
	"chip_ids" varchar(32)[] NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"saved_count" integer DEFAULT 0 NOT NULL,
	"support_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ADD COLUMN "reaction_salt" varchar(64) DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "recovery_core"."daily_post_limits" ADD CONSTRAINT "daily_post_limits_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."my_tools" ADD CONSTRAINT "my_tools_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."post_saves" ADD CONSTRAINT "post_saves_post_id_triad_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "recovery_core"."triad_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."post_supports" ADD CONSTRAINT "post_supports_post_id_triad_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "recovery_core"."triad_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."profile_notification_counters" ADD CONSTRAINT "profile_notification_counters_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."triad_posts" ADD CONSTRAINT "triad_posts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_my_tools_profile_chip" ON "recovery_core"."my_tools" USING btree ("profile_id","chip_id");--> statement-breakpoint
CREATE INDEX "idx_triad_posts_created" ON "recovery_core"."triad_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_triad_posts_category" ON "recovery_core"."triad_posts" USING btree ("category","created_at");