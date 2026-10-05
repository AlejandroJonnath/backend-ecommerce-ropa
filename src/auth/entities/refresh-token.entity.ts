import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity('refresh_tokens')

@Index('idx_refresh_tokens_user_id', ['userId'],)
@Index('idx_refresh_tokens_expires_at', ['expiresAt'],)
@Index('idx_refresh_tokens_token_hash', ['tokenHash'], { unique: true },)

export class RefreshToken {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', },)
    @JoinColumn({ name: 'user_id', })
    user: Relation<User>;

    @Column({ name: 'token_hash', type: 'varchar', length: 64, })
    tokenHash: string;

    @Column({ name: 'expires_at', type: 'timestamptz', })
    expiresAt: Date;

    @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true, })
    revokedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', })
    createdAt: Date;
}