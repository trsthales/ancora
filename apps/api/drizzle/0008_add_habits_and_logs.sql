CREATE TABLE "recovery_core"."habit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"date_key" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT date_trunc('hour', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"chip_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT date_trunc('day', now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recovery_core"."habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "recovery_core"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."habit_logs" ADD CONSTRAINT "habit_logs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_core"."habits" ADD CONSTRAINT "habits_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_habit_logs_unique_day" ON "recovery_core"."habit_logs" USING btree ("habit_id","date_key");--> statement-breakpoint
CREATE INDEX "idx_habit_logs_profile_date" ON "recovery_core"."habit_logs" USING btree ("profile_id","date_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_habits_profile_chip" ON "recovery_core"."habits" USING btree ("profile_id","chip_id");