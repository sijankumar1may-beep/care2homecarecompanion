import { WHATSAPP_NUMBER } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import { formatBookingId } from '@/lib/firebase/orders';

export function buildOpsWhatsAppMessage(order: CompanionOrder, note?: string): string {
  return `
🟢 *Care2Home Companion — Ops Update*

📋 *Booking:* ${order.bookingId}
📍 *Route:* ${order.origin || 'Pickup'} → ${order.destination || order.userAddress}
📞 *Customer:* ${order.phone}
👤 *Parent:* ${order.parentPhone || order.phone}

${note ? `📝 *Note:* ${note}` : ''}
  `.trim();
}

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildJobAcceptMessage(orderId: string): string {
  return buildOpsWhatsAppMessage(
    {
      id: orderId,
      bookingId: formatBookingId(orderId),
      phone: '',
      userAddress: '',
      status: 'active',
    },
    'I have accepted this job on the Companion app.',
  );
}
