import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../db';
import { tenants, properties, user_access } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { canAccessProperty, canEditProperty } from '../common/access.util';

@Injectable()
export class TenantService {
  async findByProperty(propertyId: string, userId: string) {
    const hasAccess = await canAccessProperty(propertyId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return db
      .select()
      .from(tenants)
      .where(eq(tenants.property, propertyId))
      .orderBy(tenants.last_name, tenants.first_name);
  }

  async findOne(id: string, userId: string) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await canAccessProperty(tenant.property, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return tenant;
  }

  async create(data: CreateTenantDto, userId: string) {
    const canEdit = await canEditProperty(data.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const [tenant] = await db
      .insert(tenants)
      .values({
        first_name: data.first_name,
        last_name: data.last_name,
        preferred_name: data.preferred_name,
        id_card_number: data.id_card_number,
        phone: data.phone,
        property: data.property,
        unit: data.unit,
        active: data.active ?? true,
      })
      .returning();

    return tenant;
  }

  async update(id: string, data: UpdateTenantDto, userId: string) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const canEdit = await canEditProperty(tenant.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {
      updated: new Date(),
    };

    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.preferred_name !== undefined) updateData.preferred_name = data.preferred_name;
    if (data.id_card_number !== undefined) updateData.id_card_number = data.id_card_number;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.active !== undefined) updateData.active = data.active;

    const [updatedTenant] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();

    return updatedTenant;
  }

  async remove(id: string, userId: string) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const canEdit = await canEditProperty(tenant.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    await db.delete(tenants).where(eq(tenants.id, id));
    return { success: true };
  }
}