import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { Button, Field, Input, Loader, Row, Small } from '../../ui'
import AddressPicker from '../../ui/AddressPicker'
import { emptyAddress, formatAddress } from '../../location/geocode'
import * as jobsApi from '../../api/jobs'
import { errorText } from '../../api/client'
import { colors, radius, space } from '../../theme'

/**
 * Which of the employer's places this work is at.
 *
 * Nearly everyone has one shop and should never think about this: it is
 * already chosen when the screen opens. The question only becomes real for
 * the owner who opened a second branch, and for them it is the most important
 * question on the form - a job at the wrong address sends workers to the
 * wrong town.
 *
 * Adding one here saves it to the account, so the second posting offers both
 * and the third does not ask again.
 */
export default function ShopPicker({ value, onChange }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState(emptyAddress())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const list = await jobsApi.shops()
      setRows(list)
      // One shop is not a choice. Pick it and let them get on with the job.
      if (!value && list.length) onChange(list.find((s) => s.primaryShop)?.id ?? list[0].id)
      // No shop at all: there is nothing to choose between, so ask for one.
      if (!list.length) setAdding(true)
    } catch {
      setRows([])
      setAdding(true)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setBusy(true); setError('')
    try {
      const created = await jobsApi.addShop({
        name: name.trim(),
        address: formatAddress(address),
        city: address.city || undefined,
        area: address.locality || undefined,
        pincode: address.pincode || undefined,
        latitude: address.latitude ?? undefined,
        longitude: address.longitude ?? undefined,
      })
      setAdding(false)
      setName('')
      setAddress(emptyAddress())
      const list = await jobsApi.shops()
      setRows(list)
      onChange(created.id)
    } catch (err) {
      setError(errorText(err, 'We could not save this place.'))
    } finally {
      setBusy(false)
    }
  }

  if (rows === null) return <Loader />

  return (
    <View>
      {rows.map((s) => {
        const on = s.id === value
        return (
          <Pressable key={s.id} onPress={() => onChange(s.id)}
            style={[st.row, on && st.rowOn]}>
            <Ionicons
              name={on ? 'radio-button-on' : 'radio-button-off'}
              size={21}
              color={on ? colors.blue : colors.muted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[st.name, on && { color: colors.blue }]}>{s.name}</Text>
              {s.address || s.pincode ? (
                <Small style={{ marginTop: 2 }} numberOfLines={2}>
                  {[s.address, s.pincode].filter(Boolean).join(' · ')}
                </Small>
              ) : null}
            </View>
          </Pressable>
        )
      })}

      {adding ? (
        <View style={st.addBox}>
          <Field label={t('shops.name')}>
            <Input value={name} onChangeText={setName}
              placeholder={t('shops.nameHint')} autoCapitalize="words" />
          </Field>
          <Field label={t('shops.where')}>
            <AddressPicker value={address} onChange={setAddress} />
          </Field>
          {error ? <Small style={{ color: colors.redText }}>{error}</Small> : null}
          <Row gap={space.md} style={{ marginTop: space.md }}>
            {rows.length ? (
              <Button title={t('common.cancel')} tone="quiet" style={{ flex: 1 }}
                onPress={() => { setAdding(false); setError('') }} />
            ) : null}
            <Button title={t('shops.save')} style={{ flex: 1 }} loading={busy} onPress={save} />
          </Row>
        </View>
      ) : (
        <Button
          title={t('shops.addAnother')}
          icon="add"
          tone="outline"
          style={{ marginTop: space.sm }}
          onPress={() => setAdding(true)}
        />
      )}
    </View>
  )
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    padding: space.md, marginBottom: space.sm,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  rowOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  name: { fontSize: 16.5, fontWeight: '700', color: colors.ink },
  addBox: {
    marginTop: space.sm, padding: space.md,
    borderWidth: 1.5, borderColor: colors.blueLine ?? colors.line,
    borderRadius: radius.lg, backgroundColor: colors.soft,
  },
})
