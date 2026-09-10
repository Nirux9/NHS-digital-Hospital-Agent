import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, getPagination } from '../utils/response';
import prisma from '../config/database';

export async function getFacilities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    const [facilities, total] = await Promise.all([
      prisma.facilities.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.facilities.count({ where }),
    ]);

    const categories = ['Emergency', 'Clinical', 'Diagnostics', 'Pharmacy', 'Laboratory', 'Imaging', 'Patient Support', 'Administration'];

    return res.status(200).json({
      success: true,
      data: {
        facilities,
        categories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      message: 'Facilities retrieved successfully from PostgreSQL',
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const facility = await prisma.facilities.findUnique({
      where: { id: Number(id) },
    });

    if (!facility) return sendError(res, 'NOT_FOUND', 'Facility not found', 404);
    return sendSuccess(res, facility, 'Facility details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, category, type, description, location, floor, contactPhone, email, openingHours, status, accessibilityInfo, isStaffOnly } = req.body;
    const facility = await prisma.facilities.create({
      data: {
        name,
        category,
        type,
        description,
        location,
        floor,
        contact_phone: contactPhone,
        email,
        opening_hours: openingHours || 'Open 24 hours',
        status: status || 'OPEN',
        accessibility_info: accessibilityInfo,
        is_staff_only: Boolean(isStaffOnly),
      },
    });
    return sendSuccess(res, facility, 'Facility created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, category, type, description, location, floor, contactPhone, email, openingHours, status, accessibilityInfo, isStaffOnly } = req.body;

    const facility = await prisma.facilities.update({
      where: { id: Number(id) },
      data: {
        name,
        category,
        type,
        description,
        location,
        floor,
        contact_phone: contactPhone,
        email,
        opening_hours: openingHours,
        status,
        accessibility_info: accessibilityInfo,
        is_staff_only: isStaffOnly !== undefined ? Boolean(isStaffOnly) : undefined,
      },
    });
    return sendSuccess(res, facility, 'Facility updated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function updateFacilityStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const facility = await prisma.facilities.update({
      where: { id: Number(id) },
      data: { status: String(status) },
    });
    return sendSuccess(res, facility, 'Facility status updated');
  } catch (error) {
    return next(error);
  }
}

export async function deleteFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.facilities.delete({
      where: { id: Number(id) },
    });
    return sendSuccess(res, null, 'Facility deleted successfully');
  } catch (error) {
    return next(error);
  }
}
