import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="work" />
      <Tabs.Screen name="control" />
      <Tabs.Screen name="rewards" />
    </Tabs>
  );
}
