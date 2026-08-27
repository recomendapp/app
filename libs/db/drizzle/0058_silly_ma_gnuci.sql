CREATE TABLE "import_source" (
	"provider" "import_job_provider" NOT NULL,
	"direction" "import_job_direction" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_light" text,
	"icon_dark" text,
	"instructions" text,
	"file_types" text[],
	"enabled" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "import_source_provider_direction_pk" PRIMARY KEY("provider","direction")
);
