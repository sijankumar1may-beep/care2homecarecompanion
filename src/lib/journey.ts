import type { JourneyStatus } from '@/lib/types/order';

export type JourneyMilestone = {
  status: JourneyStatus;
  label: string;
  message: string;
  icon: string;
};

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    status: 'met_parent',
    label: 'Met Parent',
    message: 'Companion has met your parent at arrivals with name placard.',
    icon: 'people',
  },
  {
    status: 'luggage_collected',
    label: 'Luggage Collected',
    message: 'Luggage collected. Walking to pickup area now.',
    icon: 'briefcase',
  },
  {
    status: 'in_vehicle',
    label: 'In Vehicle',
    message: 'In cab en route. Sharing live location.',
    icon: 'car',
  },
  {
    status: 'approaching_home',
    label: 'Approaching Destination',
    message: 'Reached society gate. Escorting inside.',
    icon: 'home',
  },
  {
    status: 'handover_complete',
    label: 'Handover Complete',
    message: 'Parent safely inside. Journey complete.',
    icon: 'checkmark-circle',
  },
];

export const JOURNEY_STATUS_LABELS: Record<JourneyStatus, string> = {
  unassigned: 'Unassigned',
  accepted: 'Accepted',
  met_parent: 'Met Parent',
  luggage_collected: 'Luggage Collected',
  in_vehicle: 'In Vehicle',
  approaching_home: 'Approaching Home',
  handover_complete: 'Complete',
};

export const JOURNEY_STATUS_COLORS: Record<JourneyStatus, string> = {
  unassigned: '#6B7280',
  accepted: '#2563EB',
  met_parent: '#2563EB',
  luggage_collected: '#2563EB',
  in_vehicle: '#F59E0B',
  approaching_home: '#F59E0B',
  handover_complete: '#22C55E',
};

export function getNextMilestone(current?: JourneyStatus): JourneyMilestone | null {
  if (!current || current === 'unassigned') {
    return JOURNEY_MILESTONES[0];
  }
  const index = JOURNEY_MILESTONES.findIndex((m) => m.status === current);
  if (index < 0) return JOURNEY_MILESTONES[0];
  if (index >= JOURNEY_MILESTONES.length - 1) return null;
  return JOURNEY_MILESTONES[index + 1];
}

/** Companion can release an order only before the first journey milestone is marked. */
export function canCompanionDeclineOrder(journeyStatus?: JourneyStatus): boolean {
  return journeyStatus === 'accepted';
}
