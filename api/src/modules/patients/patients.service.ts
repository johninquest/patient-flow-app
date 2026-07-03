import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../core/db';
import { patients } from '../../core/db/schema';
import { eq } from 'drizzle-orm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientsService {
  constructor(private readonly auditService: AuditService) {}

  async create(dto: CreatePatientDto, userId: string, userRole: string) {
    const [patient] = await db
      .insert(patients)
      .values({
        first_name: dto.first_name,
        last_name: dto.last_name,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        notes: dto.notes || null,
      })
      .returning();

    await this.auditService.record({
      actor_user_id: userId,
      actor_role: userRole,
      action: 'patient.created',
      resource_type: 'patient',
      resource_id: patient.id,
    });

    return patient;
  }

  async findAll() {
    return db.select().from(patients);
  }

  async findOne(id: string) {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId: string, userRole: string) {
    const existing = await this.findOne(id);

    const diff = this.auditService.calculateDiff(
      existing,
      dto,
      ['first_name', 'last_name', 'date_of_birth', 'phone', 'email', 'address', 'notes'],
    );

    const [updated] = await db
      .update(patients)
      .set({
        first_name: dto.first_name ?? existing.first_name,
        last_name: dto.last_name ?? existing.last_name,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : existing.date_of_birth,
        phone: dto.phone ?? existing.phone,
        email: dto.email ?? existing.email,
        address: dto.address ?? existing.address,
        notes: dto.notes ?? existing.notes,
        updated_at: new Date(),
      })
      .where(eq(patients.id, id))
      .returning();

    if (diff) {
      await this.auditService.record({
        actor_user_id: userId,
        actor_role: userRole,
        action: 'patient.updated',
        resource_type: 'patient',
        resource_id: id,
        diff,
      });
    }

    return updated;
  }

  async remove(id: string, userId: string, userRole: string) {
    await this.findOne(id);

    await this.auditService.record({
      actor_user_id: userId,
      actor_role: userRole,
      action: 'patient.deleted',
      resource_type: 'patient',
      resource_id: id,
    });

    await db.delete(patients).where(eq(patients.id, id));

    return { success: true };
  }
}
