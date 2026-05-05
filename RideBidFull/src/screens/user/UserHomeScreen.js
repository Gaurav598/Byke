import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, Badge, Pill, StatusBar, NavBar, BottomNav } from '../../components/SharedComponents';
import MockMap from '../../components/MockMap';
import { POPULAR_PLACES, SEARCH_RESULTS } from '../../data/mockData';

const RECENT = [
  { id: 'rec1', name: 'Manyata Tech Park', address: 'Nagavara, Bangalore', icon: '🏢' },
  { id: 'rec2', name: 'MG Road Metro', address: 'MG Road, Bangalore', icon: '🚇' },
];

export default function UserHomeScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentLocation] = useState('Koramangala 5th Block, Bangalore');

  const results = searchText.length > 1
    ? SEARCH_RESULTS.filter(r => r.name.toLowerCase().includes(searchText.toLowerCase()))
    : [];

  const handleSelectPlace = (place) => {
    navigation.navigate('UserSelectRide', {
      from: currentLocation,
      fromShort: 'Koramangala 5th',
      to: place.name,
      toShort: place.name,
      distanceKm: place.distanceKm || 18,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title="RideBid"
        rightContent={
          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileInitials}>AR</Text>
          </TouchableOpacity>
        }
      />

      {/* Map takes top portion */}
      <View style={styles.mapWrapper}>
        <MockMap height={280} showRider={false} variant="pickup" />

        {/* Location badge on map */}
        <View style={styles.locationBadge}>
          <View style={styles.locationDotG} />
          <Text style={styles.locationBadgeText} numberOfLines={1}>{currentLocation}</Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Where to go input */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => setShowSearch(true)}
          activeOpacity={0.8}
        >
          <View style={styles.searchDotR} />
          <Text style={showSearch ? styles.searchTextActive : styles.searchTextPlaceholder}>
            {showSearch ? '' : 'Where do you want to go?'}
          </Text>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>

        {/* Search overlay */}
        {showSearch ? (
          <View style={styles.searchOverlay}>
            <View style={styles.searchInputRow}>
              <View style={styles.searchDotG} />
              <Text style={styles.fromText} numberOfLines={1}>{currentLocation}</Text>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.searchInputRow}>
              <View style={styles.searchDotR} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destination..."
                placeholderTextColor={Colors.textTertiary}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            {results.length > 0 ? (
              <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                {results.map(r => (
                  <TouchableOpacity key={r.id} style={styles.resultRow} onPress={() => handleSelectPlace(r)}>
                    <View style={styles.resultIcon}><Text style={{ fontSize: 16 }}>📍</Text></View>
                    <View>
                      <Text style={styles.resultName}>{r.name}</Text>
                      <Text style={styles.resultAddr}>{r.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionLabel}>Popular places</Text>
                {POPULAR_PLACES.map(p => (
                  <TouchableOpacity key={p.id} style={styles.resultRow} onPress={() => handleSelectPlace(p)}>
                    <View style={styles.resultIcon}>
                      <Text style={{ fontSize: 16 }}>
                        {p.type === 'work' ? '🏢' : p.type === 'transit' ? '🚇' : p.type === 'airport' ? '✈️' : '📍'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{p.name}</Text>
                      <Text style={styles.resultAddr}>{p.address}</Text>
                    </View>
                    <Text style={styles.resultDist}>{p.distanceKm} km</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.cancelSearch} onPress={() => { setShowSearch(false); setSearchText(''); }}>
              <Text style={styles.cancelSearchText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Recent */}
            <Text style={styles.sectionLabel}>Recent</Text>
            {RECENT.map(r => (
              <TouchableOpacity key={r.id} style={styles.recentRow} onPress={() => handleSelectPlace({ ...r, distanceKm: 10 })}>
                <View style={styles.recentIcon}><Text style={{ fontSize: 18 }}>{r.icon}</Text></View>
                <View>
                  <Text style={styles.recentName}>{r.name}</Text>
                  <Text style={styles.recentAddr}>{r.address}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Popular */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Popular destinations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
              {POPULAR_PLACES.slice(0, 4).map(p => (
                <TouchableOpacity key={p.id} style={styles.popularCard} onPress={() => handleSelectPlace(p)}>
                  <Text style={styles.popularIcon}>
                    {p.type === 'work' ? '🏢' : p.type === 'transit' ? '🚇' : p.type === 'airport' ? '✈️' : '📍'}
                  </Text>
                  <Text style={styles.popularName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.popularDist}>{p.distanceKm} km</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        )}
      </View>

      <BottomNav items={[
        ['🏠', 'Home', true, null],
        ['🕐', 'History', false, null],
        ['💳', 'Wallet', false, null],
        ['👤', 'Profile', false, null],
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  mapWrapper: { position: 'relative' },
  locationBadge: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  locationDotG: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green, marginRight: 8 },
  locationBadgeText: { fontSize: 12, color: Colors.textPrimary, flex: 1, fontWeight: '500' },
  sheet: { flex: 1, backgroundColor: Colors.bgPrimary, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, overflow: 'hidden' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 0.5, borderColor: Colors.borderSecondary },
  searchDotR: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red, marginRight: 10 },
  searchDotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green, marginRight: 10 },
  searchTextPlaceholder: { flex: 1, fontSize: 14, color: Colors.textTertiary },
  searchTextActive: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  searchIcon: { fontSize: 16 },
  searchOverlay: { flex: 1, backgroundColor: Colors.bgPrimary },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  fromText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  dividerLine: { height: 0.5, backgroundColor: Colors.borderTertiary, marginVertical: 4 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 4 },
  clearText: { fontSize: 14, color: Colors.textTertiary, padding: 4 },
  resultsList: { maxHeight: 220 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary, gap: Spacing.sm },
  resultIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  resultAddr: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  resultDist: { fontSize: 11, color: Colors.textTertiary },
  cancelSearch: { alignItems: 'center', paddingVertical: Spacing.md },
  cancelSearchText: { fontSize: 14, color: Colors.textInfo },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary, gap: Spacing.md },
  recentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  recentName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  recentAddr: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  popularScroll: { marginBottom: Spacing.lg },
  popularCard: { width: 110, backgroundColor: Colors.bgSecondary, borderRadius: Radius.lg, padding: Spacing.md, marginRight: Spacing.md, alignItems: 'center' },
  popularIcon: { fontSize: 24, marginBottom: 6 },
  popularName: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center' },
  popularDist: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgInfo, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 13, fontWeight: '600', color: Colors.textInfo },
});
