import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../db';
import { units, properties, user_access } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { canAccessProperty, canEditProperty } from '../common/access.util';

@Injectable()
export class UnitsService {
  async findByProperty(propertyId: string, userId: string) {
    const hasAccess = await canAccessProperty(propertyId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return db
      .select()
      .from(units)
      .where(eq(units.property, propertyId))
      .orderBy(units.unit_number);
  }

  async findOne(id: string, userId: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const hasAccess = await canAccessProperty(unit.property, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return unit;
  }

  async create(data: CreateUnitDto, userId: string) {
    const canEdit = await canEditProperty(data.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const [unit] = await db
      .insert(units)
      .values({
        unit_name: data.unit_name,
        unit_number: data.unit_number,
        property: data.property,
      })
      .returning();

    return unit;
  }

  async update(id: string, data: UpdateUnitDto, userId: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const canEdit = await canEditProperty(unit.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {
      updated: new Date(),
    };

    if (data.unit_name !== undefined) updateData.unit_name = data.unit_name;
    if (data.unit_number !== undefined) updateData.unit_number = data.unit_number;

    const [updatedUnit] = await db
      .update(units)
      .set(updateData)
      .where(eq(units.id, id))
      .returning();

    return updatedUnit;
  }

  async remove(id: string, userId: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const canEdit = await canEditProperty(unit.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    await db.delete(units).where(eq(units.id, id));
    return { success: true };
  }
}