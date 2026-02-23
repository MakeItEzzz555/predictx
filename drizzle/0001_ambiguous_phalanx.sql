CREATE TABLE `market_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`yesPrice` decimal(5,2) NOT NULL,
	`noPrice` decimal(5,2) NOT NULL,
	`volume` decimal(15,2) NOT NULL DEFAULT '0.00',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`resolutionCriteria` text,
	`category` enum('politics','sports','crypto','economics','climate','tech','entertainment','health') NOT NULL DEFAULT 'politics',
	`status` enum('open','closed','resolved') NOT NULL DEFAULT 'open',
	`outcome` enum('yes','no'),
	`yesPrice` decimal(5,2) NOT NULL DEFAULT '50.00',
	`noPrice` decimal(5,2) NOT NULL DEFAULT '50.00',
	`volume` decimal(15,2) NOT NULL DEFAULT '0.00',
	`openInterest` decimal(15,2) NOT NULL DEFAULT '0.00',
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isTrending` boolean NOT NULL DEFAULT false,
	`closesAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`),
	CONSTRAINT `markets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketId` int NOT NULL,
	`side` enum('yes','no') NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`quantity` int NOT NULL,
	`pricePerContract` decimal(5,2) NOT NULL,
	`totalCost` decimal(15,2) NOT NULL,
	`status` enum('pending','filled','cancelled') NOT NULL DEFAULT 'filled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketId` int NOT NULL,
	`side` enum('yes','no') NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`avgCost` decimal(5,2) NOT NULL DEFAULT '0.00',
	`totalInvested` decimal(15,2) NOT NULL DEFAULT '0.00',
	`realizedPnl` decimal(15,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','trade_buy','trade_sell','payout','bonus') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`balanceBefore` decimal(15,2) NOT NULL,
	`balanceAfter` decimal(15,2) NOT NULL,
	`description` text,
	`stripePaymentIntentId` varchar(128),
	`orderId` int,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '1000.00',
	`totalDeposited` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalWithdrawn` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalPnl` decimal(15,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `market_prices` ADD CONSTRAINT `market_prices_marketId_markets_id_fk` FOREIGN KEY (`marketId`) REFERENCES `markets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_marketId_markets_id_fk` FOREIGN KEY (`marketId`) REFERENCES `markets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_marketId_markets_id_fk` FOREIGN KEY (`marketId`) REFERENCES `markets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;