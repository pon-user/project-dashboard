CREATE TABLE `snapshot` (
	`id` integer PRIMARY KEY NOT NULL,
	`payload` text,
	`status` text NOT NULL,
	`attempt` text NOT NULL,
	`success` text,
	`error` text,
	`revision` integer DEFAULT 0 NOT NULL
);
