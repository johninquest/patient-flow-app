import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../core/db';
import { user } from '../../core/db/schema';
import { eq, sql } from 'drizzle-orm';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UserService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * List all users (excluding sensitive fields like password).
   */
  async findAll() {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        title: user.title,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user);
  }

  /**
   * Get a single user by ID.
   */
  async findOne(id: string) {
    const [found] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        title: user.title,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!found) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return found;
  }

  /**
   * Update a user's role and/or title.
   * Prevents self-demotion from admin.
   */
  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    actorUserId: string,
    actorRole: string,
  ) {
    const existing = await this.findOne(id);

    // Prevent self-demotion from admin
    if (id === actorUserId && dto.role && dto.role !== 'admin') {
      throw new ForbiddenException('You cannot demote yourself from admin');
    }

    // Prevent removing the last admin
    if (dto.role && dto.role !== 'admin' && existing.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot demote the last admin. Promote another user to admin first.',
        );
      }
    }

    const diff = this.auditService.calculateDiff(existing, dto, [
      'role',
      'title',
    ]);

    const [updated] = await db
      .update(user)
      .set({
        role: dto.role ?? existing.role,
        title: dto.title !== undefined ? dto.title : existing.title,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        updatedAt: user.updatedAt,
      });

    if (diff) {
      await this.auditService.record({
        actor_user_id: actorUserId,
        actor_role: actorRole,
        action: 'user.role_changed',
        resource_type: 'user',
        resource_id: id,
        diff,
      });
    }

    return updated;
  }

  /**
   * Count the number of admin users.
   */
  async countAdmins(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(eq(user.role, 'admin'));

    return result?.count ?? 0;
  }
}
