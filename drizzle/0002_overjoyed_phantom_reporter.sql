CREATE TABLE `maps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`thumbnail` text,
	`web_preview` text,
	`type` text NOT NULL,
	`points` integer NOT NULL,
	`difficulty` integer NOT NULL,
	`mapper` text NOT NULL,
	`release` text NOT NULL,
	`width` integer,
	`height` integer,
	`tiles` text,
	`median_time` integer,
	`first_finish` text,
	`timestamp` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `maps_name_unique` ON `maps` (`name`);--> statement-breakpoint
CREATE INDEX `map_name_idx` ON `maps` (`name`);--> statement-breakpoint
CREATE INDEX `map_type_idx` ON `maps` (`type`);--> statement-breakpoint
CREATE INDEX `map_difficulty_idx` ON `maps` (`difficulty`);--> statement-breakpoint
CREATE INDEX `map_mapper_idx` ON `maps` (`mapper`);--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`record_count` integer,
	`error_message` text,
	`synced_at` integer
);
