import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790974289530 implements MigrationInterface {
    name = 'InitialSchema1790974289530';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // =========================================================
        // EXTENSIÓN UUID
        // =========================================================

        await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

        // =========================================================
        // ENUMS
        // =========================================================

        await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum"
      AS ENUM ('CUSTOMER', 'ADMIN')
    `);

        // =========================================================
        // USERS
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_users"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_users_email"
          UNIQUE ("email")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_users_is_active"
      ON "users" ("is_active")
    `);

        // =========================================================
        // ADDRESSES
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_name" character varying(200) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "province" character varying(100) NOT NULL,
        "city" character varying(100) NOT NULL,
        "parish" character varying(100),
        "street" character varying(255) NOT NULL,
        "reference" character varying(255),
        "postal_code" character varying(20),
        "is_default" boolean NOT NULL DEFAULT false,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_addresses"
          PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_addresses_user_id"
      ON "addresses" ("user_id")
    `);

        // =========================================================
        // CATEGORIES
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "description" text,
        "image_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_categories"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_categories_slug"
          UNIQUE ("slug")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_categories_is_active"
      ON "categories" ("is_active")
    `);

        // =========================================================
        // SIZES
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "sizes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "code" character varying(20) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_sizes"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_sizes_code"
          UNIQUE ("code"),

        CONSTRAINT "CHK_sizes_sort_order"
          CHECK ("sort_order" >= 0)
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_sizes_active_sort"
      ON "sizes" ("is_active", "sort_order")
    `);

        // =========================================================
        // COLORS
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "colors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "hex_code" character varying(7),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_colors"
          PRIMARY KEY ("id"),

        CONSTRAINT "CHK_colors_hex_code"
          CHECK (
            "hex_code" IS NULL
            OR "hex_code" ~ '^#[0-9A-Fa-f]{6}$'
          )
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_colors_is_active"
      ON "colors" ("is_active")
    `);

        // =========================================================
        // PRODUCTS
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(170) NOT NULL,
        "description" text,
        "base_price" numeric(12,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_products"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_products_slug"
          UNIQUE ("slug"),

        CONSTRAINT "CHK_products_base_price"
          CHECK ("base_price" >= 0)
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_products_category_active"
      ON "products" ("category_id", "is_active")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_products_created_at"
      ON "products" ("created_at")
    `);

        // =========================================================
        // PRODUCT IMAGES
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "image_url" text NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_product_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "CHK_product_images_position"
          CHECK ("position" >= 0)
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_product_images_product_position"
      ON "product_images" ("product_id", "position")
    `);

        // =========================================================
        // PRODUCT VARIANTS
        // =========================================================

        await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "size_id" uuid NOT NULL,
        "color_id" uuid NOT NULL,
        "sku" character varying(100) NOT NULL,
        "price" numeric(12,2),
        "cost" numeric(12,2) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_product_variants"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_product_variant_sku"
          UNIQUE ("sku"),

        CONSTRAINT "UQ_product_variant_combination"
          UNIQUE (
            "product_id",
            "size_id",
            "color_id"
          ),

        CONSTRAINT "CHK_product_variants_stock"
          CHECK ("stock" >= 0),

        CONSTRAINT "CHK_product_variants_cost"
          CHECK ("cost" >= 0),

        CONSTRAINT "CHK_product_variants_price"
          CHECK (
            "price" IS NULL
            OR "price" >= 0
          )
      )
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_product_variants_product_active"
      ON "product_variants" ("product_id", "is_active")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_product_variants_size_id"
      ON "product_variants" ("size_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_product_variants_color_id"
      ON "product_variants" ("color_id")
    `);

        // =========================================================
        // FOREIGN KEYS
        // =========================================================

        await queryRunner.query(`
      ALTER TABLE "addresses"
      ADD CONSTRAINT "FK_addresses_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "product_images"
      ADD CONSTRAINT "FK_product_images_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD CONSTRAINT "FK_product_variants_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD CONSTRAINT "FK_product_variants_size"
      FOREIGN KEY ("size_id")
      REFERENCES "sizes"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD CONSTRAINT "FK_product_variants_color"
      FOREIGN KEY ("color_id")
      REFERENCES "colors"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // =========================================================
        // FOREIGN KEYS
        // =========================================================

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP CONSTRAINT "FK_product_variants_color"
    `);

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP CONSTRAINT "FK_product_variants_size"
    `);

        await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP CONSTRAINT "FK_product_variants_product"
    `);

        await queryRunner.query(`
      ALTER TABLE "product_images"
      DROP CONSTRAINT "FK_product_images_product"
    `);

        await queryRunner.query(`
      ALTER TABLE "products"
      DROP CONSTRAINT "FK_products_category"
    `);

        await queryRunner.query(`
      ALTER TABLE "addresses"
      DROP CONSTRAINT "FK_addresses_user"
    `);

        // =========================================================
        // TABLES
        // =========================================================

        await queryRunner.query(`
      DROP TABLE "product_variants"
    `);

        await queryRunner.query(`
      DROP TABLE "product_images"
    `);

        await queryRunner.query(`
      DROP TABLE "products"
    `);

        await queryRunner.query(`
      DROP TABLE "colors"
    `);

        await queryRunner.query(`
      DROP TABLE "sizes"
    `);

        await queryRunner.query(`
      DROP TABLE "categories"
    `);

        await queryRunner.query(`
      DROP TABLE "addresses"
    `);

        await queryRunner.query(`
      DROP TABLE "users"
    `);

        // =========================================================
        // ENUM
        // =========================================================

        await queryRunner.query(`
      DROP TYPE "public"."users_role_enum"
    `);

        // uuid-ossp no se elimina porque puede ser utilizado
        // por futuras migraciones.
    }
}