import Event from './event.model.js';
import * as feedbackService from '../feedback/feedback.service.js';
import * as certificateService from '../certificates/certificate.service.js';

const CHECK_INTERVAL_MS = 60_000;
let timer: ReturnType<typeof setInterval> | null = null;

function getEndDateTime(event: any): Date | null {
  if (!event.endDate) return null;
  return new Date(event.endDate);
}

function getStartDateTime(event: any): Date {
  return new Date(event.date);
}

export const runLifecycleCheck = async (): Promise<{ completed: number; closedRegistrations: number }> => {
  const now = new Date();

  // Events that have ended but haven't yet triggered the feedback-request emails.
  const dueEvents = await Event.find({
    status: 'PUBLISHED',
    feedbackNotified: { $ne: true },
    $expr: {
      $lte: [getEndDateTimeExpr(), now],
    },
  });

  let completed = 0;
  for (const ev of dueEvents) {
    try {
      await feedbackService.sendFeedbackRequests(String(ev._id), ev.title);
    } catch (e) {
      console.error('Failed to send feedback requests for event', String(ev._id), e);
    }
    ev.feedbackNotified = true;
    ev.status = 'COMPLETED';
    await ev.save();
    completed++;
    try {
      await certificateService.autoGenerateCertificatesForEvent(String(ev._id));
    } catch (e) {
      console.error('Failed to auto-generate certificates for event', String(ev._id), e);
    }
  }

  return { completed, closedRegistrations: 0 };
};

function getEndDateTimeExpr(): any {
  return {
    $let: {
      vars: {
        endBase: { $ifNull: ['$endDate', '$date'] },
        endHour: {
          $let: {
            vars: { parts: { $split: [{ $ifNull: ['$endTime', '00:00'] }, ':'] } },
            in: { $toInt: { $arrayElemAt: ['$$parts', 0] } },
          },
        },
        endMin: {
          $let: {
            vars: { parts: { $split: [{ $ifNull: ['$endTime', '00:00'] }, ':'] } },
            in: { $toInt: { $arrayElemAt: ['$$parts', 1] } },
          },
        },
      },
      in: {
        $add: [
          '$$endBase',
          { $multiply: ['$$endHour', 3600000] },
          { $multiply: ['$$endMin', 60000] },
        ],
      },
    },
  };
}

export const isEventStarted = (event: any): boolean => {
  const now = new Date();
  const start = getStartDateTime(event);
  return now >= start;
};

export const startLifecycleScheduler = () => {
  if (timer) return;
  runLifecycleCheck().catch(() => {});
  timer = setInterval(() => {
    runLifecycleCheck().catch(() => {});
  }, CHECK_INTERVAL_MS);
};

export const stopLifecycleScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
