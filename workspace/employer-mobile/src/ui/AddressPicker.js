import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Button, Field, Input, Row, Small } from './index'
import { currentLocation } from '../location/current'
import { addressFromCoords, formatAddress, searchAddress } from '../location/geocode'
import { colors, radius, space } from '../theme'

/**
 * Picking an address three ways, because no single way works for everyone.
 *
 * Search finds the street. The phone finds the point. Neither knows the door
 * number, the floor, or which of three shops in a row this is - only the
 * person standing there knows that, so the fields stay editable whichever way
 * they were filled.
 *
 * This is the field a worker uses to decide whether a job is reachable, so a
 * resolved address is always shown back: tapping "use my location" and seeing
 * nothing change is the bug this replaces.
 */
export default function AddressPicker({ value, onChange, error }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locErr, setLocErr] = useState('')
  const abort = useRef(null)

  const a = value || {}
  const set = (patch) => onChange({ ...a, ...patch })

  // Debounced: Nominatim's policy is one request a second, and a search per
  // keystroke would both breach it and flicker results the whole time.
  useEffect(() => {
    if (mode !== 'search' || query.trim().length < 3) { setResults([]); return undefined }
    const id = setTimeout(async () => {
      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl
      setSearching(true)
      const rows = await searchAddress(query, ctrl.signal)
      setSearching(false)
      setResults(rows)
    }, 600)
    return () => clearTimeout(id)
  }, [query, mode])

  const useHere = async () => {
    setLocating(true); setLocErr('')
    const got = await currentLocation()
    if (!got.ok) {
      setLocErr(t(`business.loc_${got.reason}`))
      setLocating(false)
      return
    }
    // The whole point: turn the fix into something readable, then show it.
    const found = await addressFromCoords(got.latitude, got.longitude)
    onChange({ ...a, ...found })
    setMode('manual')
    setLocating(false)
  }

  const choose = (r) => {
    onChange({
      ...a,
      doorNo: r.doorNo || a.doorNo || '',
      building: r.building || '',
      street: r.street,
      locality: r.locality,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      latitude: r.latitude,
      longitude: r.longitude,
    })
    setResults([])
    setQuery('')
    setMode('manual')
  }

  const summary = formatAddress(a)

  return (
    <View>
      <Row gap={space.sm} style={{ marginBottom: space.md }}>
        {['search', 'manual'].map((m) => (
          <Pressable key={m} onPress={() => setMode(m)}
            style={[s.tab, mode === m && s.tabOn]}>
            <Text style={[s.tabText, mode === m && s.tabTextOn]}>
              {t(m === 'search' ? 'address.search' : 'address.manual')}
            </Text>
          </Pressable>
        ))}
      </Row>

      <Button
        title={locating ? t('address.locating') : t('address.useMyLocation')}
        icon="locate"
        tone="outline"
        loading={locating}
        onPress={useHere}
        style={{ marginBottom: space.md }}
      />
      {locErr ? <Small style={{ color: colors.redText, marginBottom: space.sm }}>{locErr}</Small> : null}

      {mode === 'search' ? (
        <>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t('address.searchHint')}
            autoCorrect={false}
          />
          {searching ? (
            <Row gap={space.sm} style={{ marginTop: space.sm }}>
              <ActivityIndicator size="small" color={colors.blue} />
              <Small>{t('address.searching')}</Small>
            </Row>
          ) : null}
          {results.length ? (
            <ScrollView style={s.results} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {results.map((r) => (
                <Pressable key={r.id} onPress={() => choose(r)} style={s.result}>
                  <Ionicons name="location-outline" size={17} color={colors.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultMain} numberOfLines={1}>
                      {r.street || r.locality || r.city}
                    </Text>
                    <Small numberOfLines={2}>{r.label}</Small>
                    {r.pincode ? <Small style={s.pin}>PIN {r.pincode}</Small> : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </>
      ) : null}

      {mode === 'manual' ? (
        <>
          {/* Always editable, however it was filled. A geocoder never knows
              the floor, and "shop 3" is the part that gets someone to the door. */}
          <Field label={t('address.doorNo')}>
            <Input value={a.doorNo || ''} onChangeText={(v) => set({ doorNo: v })}
              placeholder={t('address.doorNoHint')} />
          </Field>
          <Field label={t('address.building')} hint={t('common.optional')}>
            <Input value={a.building || ''} onChangeText={(v) => set({ building: v })} />
          </Field>
          <Field label={t('address.street')}>
            <Input value={a.street || ''} onChangeText={(v) => set({ street: v })} />
          </Field>
          <Field label={t('address.locality')}>
            <Input value={a.locality || ''} onChangeText={(v) => set({ locality: v })} />
          </Field>
          <Row gap={space.md}>
            <View style={{ flex: 1 }}>
              <Field label={t('address.city')}>
                <Input value={a.city || ''} onChangeText={(v) => set({ city: v })} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('address.pincode')}>
                <Input value={a.pincode || ''} onChangeText={(v) => set({ pincode: v.replace(/\D/g, '') })}
                  keyboardType="number-pad" maxLength={6} />
              </Field>
            </View>
          </Row>
        </>
      ) : null}

      {summary ? (
        <View style={s.summary}>
          <Ionicons name="checkmark-circle" size={16} color={colors.greenText} />
          <Small style={{ flex: 1, color: colors.ink }}>{summary}</Small>
        </View>
      ) : null}

      {error ? <Small style={{ color: colors.redText, marginTop: space.sm }}>{error}</Small> : null}
    </View>
  )
}

const s = StyleSheet.create({
  tab: {
    paddingHorizontal: space.lg, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white,
  },
  tabOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tabText: { fontSize: 14.5, fontWeight: '700', color: colors.body },
  tabTextOn: { color: colors.blue },
  results: { maxHeight: 260, marginTop: space.sm },
  result: {
    flexDirection: 'row', gap: space.sm, alignItems: 'flex-start',
    paddingVertical: space.md, paddingHorizontal: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  resultMain: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  pin: { marginTop: 2, color: colors.blue, fontWeight: '700' },
  summary: {
    flexDirection: 'row', gap: space.sm, alignItems: 'flex-start',
    marginTop: space.md, padding: space.md,
    borderRadius: radius.md, backgroundColor: colors.greenSoft,
  },
})
