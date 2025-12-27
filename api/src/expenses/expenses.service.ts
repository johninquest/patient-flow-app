import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../db';
import { expenses, properties, user_access } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { canAccessProperty, canEditProperty } from '../common/access.util';

@Injectable()
export class ExpensesService {
  async findByProperty(propertyId: string, userId: string) {
    const canAccess = await canAccessProperty(propertyId, userId);
    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }

    return db
      .select()
      .from(expenses)
      .where(eq(expenses.property, propertyId))
      .orderBy(expenses.expense_date);
  }

  async findOne(id: string, userId: string) {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const canAccess = await canAccessProperty(expense.property, userId);
    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }

    return expense;
  }

  async create(data: CreateExpenseDto, userId: string) {
    const canEdit = await canEditProperty(data.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const [expense] = await db
      .insert(expenses)
      .values({
        property: data.property,
        unit: data.unit,
        category: data.category,
        description: data.description,
        amount: data.amount.toString(),
        expense_date: new Date(data.expense_date),
        vendor: data.vendor,
        recorded_by: userId,
      })
      .returning();

    return expense;
  }

  async update(id: string, data: UpdateExpenseDto, userId: string) {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const canEdit = await canEditProperty(expense.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {};
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.category) updateData.category = data.category;
    if (data.description) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.expense_date) updateData.expense_date = new Date(data.expense_date);
    if (data.vendor !== undefined) updateData.vendor = data.vendor;

    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, userId: string) {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const canEdit = await canEditProperty(expense.property, userId);
    if (!canEdit) {
      throw new ForbiddenException('Access denied');
    }

    await db.delete(expenses).where(eq(expenses.id, id));
    return { success: true };
  }
}