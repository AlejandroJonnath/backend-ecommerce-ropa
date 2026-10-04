import { MigrationInterface, QueryRunner } from "typeorm";

export class Inventory1790981288292 implements MigrationInterface {
    name = 'Inventory1790981288292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_variant_id" uuid NOT NULL, "type" "public"."inventory_movements_type_enum" NOT NULL, "quantity" integer NOT NULL, "stock_before" integer NOT NULL, "stock_after" integer NOT NULL, "user_id" uuid, "reason" text, "reference_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_inventory_movements_created_at" ON "inventory_movements"  ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_inventory_movements_type" ON "inventory_movements"  ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_inventory_movements_variant_date" ON "inventory_movements"  ("product_variant_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_53f466e8e8bee109aea4cefddf5" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_63cca4adcd28b6fe19bc4ceb22f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_63cca4adcd28b6fe19bc4ceb22f"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_53f466e8e8bee109aea4cefddf5"`);
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_variant_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_created_at"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_type_enum"`);
    }

}
