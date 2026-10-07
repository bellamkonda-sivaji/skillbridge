import React from 'react'
import { Share, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button, Card, KV, Screen, Small, Spacer, SuccessPanel, money } from '../../ui'
import { splitPrice } from '../../ui/catalog'
import { space } from '../../theme'

/** Confirmation, with the split repeated so the fee is never a surprise. */
export default function JobPublished({ navigation, route }) {
  const { t } = useTranslation()
  const job = route?.params?.job || {}
  const split = splitPrice(job.salary)

  const share = () => {
    Share.share({
      message: `We are hiring: ${job.title} at ${job.businessName || 'our shop'}. Apply on JobOn.`,
    }).catch(() => { /* the sheet was dismissed */ })
  }

  return (
    <Screen
      bg="#FFFFFF"
      footer={(
        <View style={{ gap: space.md }}>
          {/* Money first. A posted job with nothing behind it cannot pay
              anyone, and an employer who leaves this screen rarely comes back
              to a funding page they never saw. */}
          <Button
            title={t('post.fundNow')}
            icon="wallet-outline"
            onPress={() => navigation.replace('FundJob', {
              jobId: job.id, jobTitle: job.title,
            })}
          />
          <Button
            title={t('post.viewJob')}
            tone="outline"
            onPress={() => navigation.replace('JobManagement', { jobId: job.id })}
          />
          <Button
            title={t('post.postAnother')}
            tone="quiet"
            onPress={() => navigation.replace('PostJob')}
          />
        </View>
      )}
    >
      <SuccessPanel title={t('post.liveTitle')} sub={t('post.liveSub')}>
        <Card style={{ alignSelf: 'stretch', marginTop: space.xxl }}>
          <KV k={t('post.jobTitle')} v={job.title} strong />
          <KV k={t('post.openings')} v={String(job.workersNeeded || 1)} />
          <KV k={t('post.youPay')} v={money(job.salary)} />
        </Card>
        <Button
          title={t('post.share')}
          icon="share-social-outline"
          tone="outline"
          style={{ alignSelf: 'stretch', marginTop: space.lg }}
          onPress={share}
        />
      </SuccessPanel>
      <Spacer h={space.lg} />
    </Screen>
  )
}

const s = StyleSheet.create({})
