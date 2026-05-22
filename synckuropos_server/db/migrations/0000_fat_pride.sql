CREATE TABLE "combo_products" (
	"comboProductId" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"comboQuantity" real NOT NULL,
	"comboPrice" integer NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"customerId" text PRIMARY KEY NOT NULL,
	"fullname" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"allowCredit" boolean DEFAULT false NOT NULL,
	"creditLimit" integer DEFAULT 0 NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"debtPaymentId" text PRIMARY KEY NOT NULL,
	"debtId" text NOT NULL,
	"userId" text NOT NULL,
	"amountPaid" integer NOT NULL,
	"paymentDate" integer NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"debtId" text PRIMARY KEY NOT NULL,
	"customerId" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"productId" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"basePrice" integer NOT NULL,
	"isTaxable" boolean DEFAULT true NOT NULL,
	"allowDecimalQuantity" boolean DEFAULT false NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" text PRIMARY KEY NOT NULL,
	"saleId" text NOT NULL,
	"productId" text NOT NULL,
	"quantity" real NOT NULL,
	"unitPrice" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"taxAmount" integer DEFAULT 0 NOT NULL,
	"lineTotal" integer NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"saleId" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"customerId" text NOT NULL,
	"totalAmount" integer NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"isPartOfDebt" boolean DEFAULT false NOT NULL,
	"SRIStatus" text DEFAULT 'pending' NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"delta" real NOT NULL,
	"reason" text NOT NULL,
	"referenceId" text,
	"referenceType" text,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplyings" (
	"supplyingId" text PRIMARY KEY NOT NULL,
	"userId" text,
	"supplierName" text,
	"productId" text NOT NULL,
	"unitCost" integer NOT NULL,
	"quantity" real NOT NULL,
	"reason" text,
	"supplyDate" integer NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"userId" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" text NOT NULL,
	"_deleted" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"synced" integer DEFAULT 0 NOT NULL
);
