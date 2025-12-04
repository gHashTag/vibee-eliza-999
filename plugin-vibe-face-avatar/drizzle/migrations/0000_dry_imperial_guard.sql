CREATE TABLE "user_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"entity_id" varchar(50),
	"bot_name" varchar(100) DEFAULT 'neuro_face_bot' NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_url" text NOT NULL,
	"trigger_word" varchar(50) NOT NULL,
	"gender" varchar(10),
	"training_model" varchar(100),
	"status" varchar(20) DEFAULT 'training' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_user_models_telegram_id" ON "user_models" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "idx_user_models_entity_id" ON "user_models" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_user_models_bot_name" ON "user_models" USING btree ("bot_name");--> statement-breakpoint
CREATE INDEX "idx_user_models_status" ON "user_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_models_is_active" ON "user_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_models_telegram_bot" ON "user_models" USING btree ("telegram_id","bot_name");