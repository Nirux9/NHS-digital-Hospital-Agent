import { NotificationType } from '@prisma/client';
import prisma from '../config/database';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType
) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}

export async function notifyAppointmentConfirmed(userId: string, date: string, time: string) {
  return createNotification(
    userId,
    'Appointment Confirmed',
    `Your appointment has been scheduled for ${date} at ${time}.`,
    NotificationType.APPOINTMENT
  );
}

export async function notifyTestResult(userId: string, testName: string) {
  return createNotification(
    userId,
    'Test Result Available',
    `Your results for ${testName} are now available in your portal.`,
    NotificationType.TEST_RESULT
  );
}

export async function notifyPrescription(userId: string, medication: string) {
  return createNotification(
    userId,
    'New Prescription Issued',
    `A prescription for ${medication} has been issued.`,
    NotificationType.PRESCRIPTION
  );
}

export async function notifyTriageAlert(userId: string, severity: string) {
  return createNotification(
    userId,
    'Triage Alert',
    `A new ${severity} triage alert requires attention.`,
    NotificationType.TRIAGE
  );
}
