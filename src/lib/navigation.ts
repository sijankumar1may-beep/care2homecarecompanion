import { router } from 'expo-router';

export function navigateFromDrawer(path: string, closeDrawer?: () => void) {
  closeDrawer?.();
  router.push(path as never);
}
