import { useMemo, useState } from 'react'
import { Map, Text, View } from '@tarojs/components'
import type { Spot } from '@shared/domain'
import { countyPolygons, coverageCountyNames } from '../../utils/county-polygons'
import './index.scss'

type RouteMapProps = {
  spots: Spot[]
  title?: string
  showPolyline?: boolean
  compact?: boolean
  overviewMode?: boolean
  onSpotTap?: (spot: Spot) => void
}

export default function RouteMap ({
  spots,
  title = '点位地图',
  showPolyline = true,
  compact = false,
  overviewMode = false,
  onSpotTap
}: RouteMapProps) {
  const [mapScale, setMapScale] = useState(overviewMode ? 7 : 8)
  const polygons = useMemo(() => countyPolygons(spots), [spots])
  const countyNames = useMemo(() => coverageCountyNames(spots), [spots])
  if (spots.length === 0) return null

  const center = spots.reduce(
    (result, spot) => ({ latitude: result.latitude + spot.lat / spots.length, longitude: result.longitude + spot.lng / spots.length }),
    { latitude: 0, longitude: 0 }
  )
  const points = spots.map((spot) => ({ latitude: spot.lat, longitude: spot.lng }))
  const visibleSpots = overviewMode
    ? mapScale < 8
      ? []
      : mapScale < 9
        ? spots.filter((spot) => spot.core)
        : spots
    : spots
  const markers = visibleSpots.map((spot, index) => ({
    id: index + 1,
    latitude: spot.lat,
    longitude: spot.lng,
    title: `${index + 1}. ${spot.short}`,
    iconPath: spot.image,
    width: compact ? 22 : 28,
    height: compact ? 22 : 28,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: `${index + 1}. ${spot.short}`,
      color: '#5b1117',
      fontSize: 12,
      anchorX: 0,
      anchorY: -24,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#b77f3f',
      bgColor: '#fffaf1',
      padding: 5,
      display: overviewMode && mapScale >= 8 ? 'ALWAYS' as const : 'BYCLICK' as const,
      textAlign: 'center' as const
    }
  }))
  const polyline = showPolyline && points.length > 1
    ? [{ points, color: '#851f25DD', width: 4, arrowLine: true, borderColor: '#fff7e9', borderWidth: 1 }]
    : []

  return (
    <View className={`route-map-shell ${compact ? 'route-map-compact' : ''}`}>
      <View className='route-map-head'>
        <View><Text>MAP OVERVIEW</Text><Text>{title}</Text></View>
        <Text>{spots.length} 个点位</Text>
      </View>
      <Map
        className='route-map'
        longitude={center.longitude}
        latitude={center.latitude}
        scale={overviewMode ? mapScale : 8}
        markers={markers}
        polygons={polygons}
        polyline={polyline}
        includePoints={overviewMode && mapScale > 7 ? undefined : points}
        showScale
        enableZoom
        enableScroll
        onError={() => undefined}
        onRegionChange={(event) => {
          const detail = event.detail as unknown as { type?: string; scale?: number; detail?: { scale?: number } }
          if (!overviewMode || detail.type !== 'end') return
          const nextScale = Number(detail.scale ?? detail.detail?.scale)
          if (Number.isFinite(nextScale)) setMapScale(nextScale)
        }}
        onMarkerTap={(event) => {
          const markerId = Number(event.detail.markerId)
          const spot = visibleSpots[markerId - 1]
          if (spot) onSpotTap?.(spot)
        }}
      />
      <View className='route-map-coverage'>
        <Text>资源覆盖县区 · {countyNames.length}</Text>
        <Text>{overviewMode ? mapScale < 8 ? '放大查看核心点位' : mapScale < 9 ? '核心点位模式' : '全部点位与名称' : countyNames.join('、')}</Text>
      </View>
      <View className='route-map-legend'>
        {spots.slice(0, compact ? 4 : 8).map((spot, index) => (
          <View key={spot.id} onClick={() => onSpotTap?.(spot)}><Text>{index + 1}</Text><Text>{spot.short}</Text></View>
        ))}
        {spots.length > (compact ? 4 : 8) && <Text className='route-map-more'>另有 {spots.length - (compact ? 4 : 8)} 处点位，可在地图中缩放查看</Text>}
      </View>
    </View>
  )
}
