import React, { useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../theme'

/**
 * A photo with somewhere to land when there is not one.
 *
 * The backend stores photos as base64 data URLs, and plenty of records have
 * none, so every image surface needs a fallback that still looks deliberate.
 * A broken-image icon or an empty grey box both read as a bug.
 */
export default function Photo({
  uri, art, width, height, size, radius: r = radius.md, icon = 'image-outline',
  iconSize, tone = colors.blue, bg = colors.blueSoft, style, resizeMode = 'cover',
}) {
  const [failed, setFailed] = useState(false)
  const w = width ?? size
  const h = height ?? size
  const box = [{ width: w, height: h, borderRadius: r }, style]

  // Order matters: a real photo, then the drawing for this kind of work, then
  // an icon. A wall of identical icons makes every job look the same.
  if ((!uri || failed) && art) {
    return <Image source={art} style={box} resizeMode={resizeMode} accessible={false} />
  }

  if (!uri || failed) {
    return (
      <View style={[s.fallback, { backgroundColor: bg }, ...box]}>
        <Ionicons name={icon} size={iconSize ?? Math.max(18, Math.min(40, (h || 60) * 0.38))} color={tone} />
      </View>
    )
  }
  return (
    <Image
      source={{ uri }}
      style={box}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
      accessible={false}
    />
  )
}

const s = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
})
