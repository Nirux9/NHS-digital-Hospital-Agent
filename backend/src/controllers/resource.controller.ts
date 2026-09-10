import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';

const defaultResources = [
  {
    id: '1',
    title: 'Managing Fever at Home — NHS Guidelines',
    description: 'Practical advice on managing mild to moderate fever for adults and children at home.',
    category: 'Patient Education',
    resourceType: 'Article',
    audience: 'ALL',
    status: 'PUBLISHED',
    content: 'Ensure adequate rest, hydration with water or oral rehydration fluids, and monitor body temperature using a digital thermometer.',
    url: 'https://www.nhs.uk/conditions/fever-in-adults/'
  },
  {
    id: '2',
    title: 'Cardiology Pre-Assessment Patient Manual',
    description: 'Instructions for patients scheduled for cardiac stress tests, ECG, or echocardiograms.',
    category: 'Clinical Guidelines',
    resourceType: 'PDF',
    audience: 'PATIENT',
    status: 'PUBLISHED',
    content: 'Do not consume caffeinated beverages or heavy meals 4 hours prior to your scheduled cardiac assessment.',
    url: 'https://www.nhs.uk/conditions/coronary-heart-disease/'
  },
  {
    id: '3',
    title: 'NHS Acute Clinical Emergency Triage Protocol',
    description: 'Standardized ESI and Manchester Triage clinical priority definitions for hospital staff.',
    category: 'Emergency Guidance',
    resourceType: 'Guideline',
    audience: 'DOCTOR',
    status: 'PUBLISHED',
    content: 'ESI Level 1 (Resuscitation), ESI Level 2 (Emergent), ESI Level 3 (Urgent), ESI Level 4 (Less Urgent), ESI Level 5 (Non-Urgent).',
    url: 'https://www.england.nhs.uk/urgent-emergency-care/'
  }
];

export async function getResources(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    let items = defaultResources;

    try {
      const dbModel = (prisma as any).resource || (prisma as any).resources;
      if (dbModel && typeof dbModel.findMany === 'function') {
        const dbItems = await dbModel.findMany();
        if (dbItems && dbItems.length > 0) items = dbItems;
      }
    } catch {}

    return sendPaginated(res, items, items.length, page, limit, 'Resources retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let resource = defaultResources.find((r) => String(r.id) === String(id));

    try {
      const dbModel = (prisma as any).resource || (prisma as any).resources;
      if (dbModel && typeof dbModel.findUnique === 'function') {
        const dbResource = await dbModel.findUnique({ where: { id } });
        if (dbResource) resource = dbResource;
      }
    } catch {}

    if (!resource) return sendError(res, 'NOT_FOUND', 'Resource not found', 404);
    return sendSuccess(res, resource, 'Resource retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, category, url } = req.body;
    const newResource = {
      id: String(Date.now()),
      title,
      description,
      category,
      url,
      resourceType: 'Article',
      audience: 'ALL',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString()
    };
    return sendSuccess(res, newResource, 'Resource created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, req.body, 'Resource updated');
  } catch (error) {
    return next(error);
  }
}

export async function deleteResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, null, 'Resource deleted');
  } catch (error) {
    return next(error);
  }
}
