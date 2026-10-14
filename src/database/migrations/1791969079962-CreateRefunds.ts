import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefunds1791969079962 implements MigrationInterface {
    name = 'CreateRefunds1791969079962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "transaction_reference" TO "external_reference"`);
        await queryRunner.query(`CREATE TYPE "public"."refunds_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."refunds_status_enum" NOT NULL DEFAULT 'PENDING', "external_reference" character varying(255), "reason" text, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_refunds_amount_positive" CHECK (amount > 0), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refunds_status" ON "refunds"  ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_refunds_payment_created_at" ON "refunds"  ("payment_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_dcf8f786aaeb2746c93a332b635" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_dcf8f786aaeb2746c93a332b635"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_7f48aa5d56c42aeb495db016683"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refunds_payment_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refunds_status"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
        await queryRunner.query(`DROP TYPE "public"."refunds_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "external_reference" TO "transaction_reference"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
