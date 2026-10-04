import { MigrationInterface, QueryRunner } from "typeorm";

export class SalesAndFinance1790980234738 implements MigrationInterface {
    name = 'SalesAndFinance1790980234738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_product_variants_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_variants_stock"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_variants_product_id"`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_variant_id" uuid NOT NULL, "productName" character varying(150) NOT NULL, "sku" character varying(100) NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(12,2) NOT NULL, "unit_cost" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_order_item_order_variant" UNIQUE ("order_id", "product_variant_id"), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product_variant_id" ON "order_items"  ("product_variant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_order_items_order_id" ON "order_items"  ("order_id") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('CASH', 'TRANSFER', 'CARD', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "amount" numeric(12,2) NOT NULL, "transaction_reference" character varying(255), "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payments_created_at" ON "payments"  ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments"  ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_payments_order_id" ON "payments"  ("order_id") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "subtotal" numeric(12,2) NOT NULL, "discount" numeric(12,2) NOT NULL DEFAULT '0', "shipping_cost" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL, "shipping_recipient_name" character varying(200) NOT NULL, "shipping_phone" character varying(20) NOT NULL, "shipping_province" character varying(100) NOT NULL, "shipping_city" character varying(100) NOT NULL, "shipping_parish" character varying(100), "shipping_street" character varying(255) NOT NULL, "shipping_reference" character varying(255), "shipping_postal_code" character varying(20), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_orders_created_at" ON "orders"  ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders"  ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_user_created_at" ON "orders"  ("user_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "expense_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0c8f86a1bcafe870a37735a02bd" UNIQUE ("slug"), CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "description" character varying(200) NOT NULL, "amount" numeric(12,2) NOT NULL, "expense_date" date NOT NULL, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_expenses_created_at" ON "expenses"  ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_expenses_expense_date" ON "expenses"  ("expense_date") `);
        await queryRunner.query(`CREATE INDEX "idx_expenses_category_id" ON "expenses"  ("category_id") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "first_name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "idx_product_variants_product_active" ON "product_variants"  ("product_id", "is_active") `);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_11836543386b9135a47d54cab70" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_11836543386b9135a47d54cab70"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_variants_product_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(100) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_expense_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_created_at"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TABLE "expense_categories"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_user_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_created_at"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_created_at"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_product_variant_id"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`CREATE INDEX "idx_product_variants_product_id" ON "product_variants" USING btree ("product_id") `);
        await queryRunner.query(`CREATE INDEX "idx_product_variants_stock" ON "product_variants" USING btree ("stock") `);
        await queryRunner.query(`CREATE INDEX "idx_product_variants_is_active" ON "product_variants" USING btree ("is_active") `);
    }

}
