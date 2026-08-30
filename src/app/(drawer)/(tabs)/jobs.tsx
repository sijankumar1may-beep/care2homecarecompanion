import { useAuth } from '@/auth/AuthContext';
import { JobCard } from '@/components/jobs/JobCard';
import { useContentBottomPadding } from '@/hooks/useContentBottomPadding';
import {
  subscribeAvailableOrders,
  subscribeCompletedOrders,
  subscribeMyOrders,
} from '@/lib/firebase/orders';
import { colors, spacing } from '@/lib/theme';
import type { CompanionOrder, JobsTab } from '@/lib/types/order';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const TABS: { key: JobsTab; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'mine', label: 'My Orders' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const listBottomPadding = useContentBottomPadding();
  const [activeTab, setActiveTab] = useState<JobsTab>('available');
  const [available, setAvailable] = useState<CompanionOrder[]>([]);
  const [mine, setMine] = useState<CompanionOrder[]>([]);
  const [completed, setCompleted] = useState<CompanionOrder[]>([]);

  useEffect(() => subscribeAvailableOrders(setAvailable), []);

  useEffect(() => {
    if (!user?.phoneNumber) return;
    return subscribeMyOrders(user.phoneNumber, setMine);
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (!user?.phoneNumber) return;
    return subscribeCompletedOrders(user.phoneNumber, setCompleted);
  }, [user?.phoneNumber]);

  const data =
    activeTab === 'available' ? available : activeTab === 'mine' ? mine : completed;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'available'
                ? 'No available jobs right now. Check back soon.'
                : activeTab === 'mine'
                  ? 'You have no active jobs.'
                  : 'No completed journeys yet.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <JobCard order={item} onPress={() => router.push(`/job/${item.id}` as never)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.careBlueLight },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { color: colors.headerBlue },
  list: { padding: spacing.lg, flexGrow: 1 },
  empty: { padding: spacing.xxxl, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.gray500, fontSize: 15, lineHeight: 22 },
});
