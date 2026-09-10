import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, getPagination } from '../utils/response';
import prisma from '../config/database';

export async function getServices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    const { search, category } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (category && String(category) !== 'ALL') {
      where.category = { equals: String(category), mode: 'insensitive' };
    }

    const [services, total] = await Promise.all([
      prisma.services.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          facilities: { select: { name: true } }
        },
        orderBy: { id: 'asc' },
      }),
      prisma.services.count({ where }),
    ]);

    const formattedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      departmentId: s.department_id,
      facilityId: s.facility_id,
      facilityName: s.facilities?.name || 'Main Hospital',
      location: s.location || 'Ground Floor',
      openingHours: s.opening_hours,
      status: s.status,
      contactPhone: s.contact_phone,
      isStaffOnly: s.is_staff_only,
    }));

    const categories = ['Emergency', 'Clinical', 'Diagnostics', 'Pharmacy', 'Laboratory', 'Imaging', 'Patient Support', 'Administration'];

    return res.status(200).json({
      success: true,
      data: {
        services: formattedServices,
        categories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      message: 'Services retrieved successfully from PostgreSQL',
    });
  } catch (error) {
    return next(error);
  }
}

export async function getServiceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const s = await prisma.services.findUnique({
      where: { id: Number(id) },
      include: { facilities: { select: { name: true } } }
    });

    if (!s) return sendError(res, 'NOT_FOUND', 'Service not found', 404);

    const formatted = {
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      departmentId: s.department_id,
      facilityId: s.facility_id,
      facilityName: s.facilities?.name || 'Main Hospital',
      location: s.location || 'Ground Floor',
      openingHours: s.opening_hours,
      status: s.status,
      contactPhone: s.contact_phone,
      isStaffOnly: s.is_staff_only,
    };

    return sendSuccess(res, formatted, 'Service details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, category, facilityId, location, openingHours, status, contactPhone, isStaffOnly } = req.body;

    const s = await prisma.services.create({
      data: {
        name,
        description,
        category,
        facility_id: facilityId ? Number(facilityId) : null,
        location,
        opening_hours: openingHours || 'Open 24 hours',
        status: status || 'OPEN',
        contact_phone: contactPhone,
        is_staff_only: Boolean(isStaffOnly),
      },
    });

    return sendSuccess(res, s, 'Service created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, description, category, facilityId, location, openingHours, status, contactPhone, isStaffOnly } = req.body;

    const s = await prisma.services.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        category,
        facility_id: facilityId ? Number(facilityId) : undefined,
        location,
        opening_hours: openingHours,
        status,
        contact_phone: contactPhone,
        is_staff_only: isStaffOnly !== undefined ? Boolean(isStaffOnly) : undefined,
      },
    });

    return sendSuccess(res, s, 'Service updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function updateServiceStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const s = await prisma.services.update({
      where: { id: Number(id) },
      data: { status: String(status) },
    });

    return sendSuccess(res, s, 'Service status updated');
  } catch (error) {
    return next(error);
  }
}

export async function deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.services.delete({
      where: { id: Number(id) },
    });
    return sendSuccess(res, null, 'Service deleted successfully');
  } catch (error) {
    return next(error);
  }
}
