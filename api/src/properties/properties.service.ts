import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../db';
import { properties, user_access } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { canAccessProperty, canEditProperty, isPropertyOwner } from '../common/access.util';

@Injectable()
export class PropertiesService {
  async findAll(userId: string) {
    // Properties owned by user
    const owned = await db
      .select()
      .from(properties)
      .where(eq(properties.owner, userId));

    // Properties shared via user_access
    const shared = await db
      .select({
        id: properties.id,
        name: properties.name,
        city: properties.city,
        country: properties.country,
        construction_year: properties.construction_year, // Changed from constructionYear
        owner: properties.owner,
        created: properties.created,
        updated: properties.updated,
      })
      .from(user_access) // Changed from userAccess
      .innerJoin(properties, eq(user_access.property, properties.id))
      .where(eq(user_access.user, userId));

    return [...owned, ...shared];
  }

  async findOwned(userId: string) {
    return db.select().from(properties).where(eq(properties.owner, userId));
  }

  async findOne(id: string, userId: string) {
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property.length) {
      throw new NotFoundException('Property not found');
    }

    const hasAccess = await canAccessProperty(id, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return property[0];
  }

  async create(data: CreatePropertyDto, userId: string) {
    const [property] = await db
      .insert(properties)
      .values({
        name: data.name,
        city: data.city,
        country: data.country,
        construction_year: data.construction_year, // Changed from constructionYear
        owner: userId,
      })
      .returning();
    return property;
  }

  async update(id: string, data: UpdatePropertyDto, userId: string) {
    const canEdit = await canEditProperty(id, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {
      updated: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.construction_year !== undefined)
      updateData.construction_year = data.construction_year;

    const [property] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async remove(id: string, userId: string) {
    const isOwner = await isPropertyOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only owner can delete property');
    }

    await db.delete(properties).where(eq(properties.id, id));
    return { success: true };
  }
}