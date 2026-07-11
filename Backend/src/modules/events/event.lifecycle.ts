import Event from './event.model.js';

const CHECK_INTERVAL_MS = 60_000;
let timer: ReturnType<typeof setInterval> | null = null;

function getEndDateTime(event: any): Date | null {
  if (!event.endDate) return null;
  const end = new Date(event.endDate);
  if (event.endTime) {
    const [h, m] = event.endTime.split(':').map(Number);
    end.setHours(h, m, 0, 0);
  }
  return end;
}

function getStartDateTime(event: any): Date {
  const start = new Date(event.date);
  if (event.startTime) {
    const [h, m] = event.startTime.split(':').map(Number);
    start.setHours(h, m, 0, 0);
  }
  return start;
}

export const runLifecycleCheck = async (): Promise<{ completed: number; closedRegistrations: number }> => {
  const now = new Date();

  const completedResult = await Event.updateMany(
    {
      status: 'PUBLISHED',
      $expr: {
        $lte: [
          getEndDateTimeExpr(),
          now,
        ],
      },
    },
    { $set: { status: 'COMPLETED' } },
  );

  return { completed: completedResult.modifiedCount, closedRegistrations: 0 };
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
