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
  const indexedSpots = spots.map((spot, sourceIndex) => ({ spot, sourceIndex }))
  const visibleSpots = overviewMode
    ? mapScale < 8
      ? []
      : mapScale < 9
        ? indexedSpots.filter(({ spot }) => spot.core)
        : indexedSpots
    : indexedSpots
  const markers = visibleSpots.map(({ spot, sourceIndex }) => ({
    id: sourceIndex + 1,
    latitude: spot.lat,
    longitude: spot.lng,
    title: `${sourceIndex + 1}. ${spot.short}`,
    iconPath: '/map/marker-anchor.png',
    width: 1,
    height: 1,
    anchor: { x: 0.5, y: 0.5 },
    ariaLabel: `第 ${sourceIndex + 1} 处，${spot.name}`,
    label: {
      content: String(sourceIndex + 1),
      color: '#fffaf1',
      fontSize: compact ? 10 : 11,
      anchorX: compact ? -8 : -9,
      anchorY: compact ? -8 : -9,
      borderRadius: compact ? 9 : 10,
      borderWidth: 1,
      borderColor: '#d6a45b',
      bgColor: '#851f25',
      padding: compact ? 3 : 4,
      textAlign: 'center' as const
    },
    callout: {
      content: spot.short,
      color: '#5b1117',
      fontSize: 12,
      anchorX: 0,
      anchorY: -28,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#b77f3f',
      bgColor: '#fffaf1',
      padding: 5,
      display: overviewMode && mapScale >= 9 ? 'ALWAYS' as const : 'BYCLICK' as const,
      textAlign: 'center' as const
    }
  }))
  const openMarker = (markerId: number | string) => {
    const spot = spots[Number(markerId) - 1]
    if (spot) onSpotTap?.(spot)
  }
  const legendLimit = compact ? 4 : 8
  const legendSpots = overviewMode ? spots : spots.slice(0, legendLimit)
  const polyline = showPolyline && points.length > 1
    ? [{ points, color: '#851f25DD', width: 4, arrowLine: true, borderColor: '#fff7e9', borderWidth: 1 }]
    : []

  return (
    <View className={`route-map-shell ${compact ? 'route-map-compact' : ''} ${overviewMode ? 'route-map-overview' : ''}`}>
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
          openMarker(event.detail.markerId)
        }}
        onLabelTap={(event) => {
          openMarker(event.detail.markerId)
        }}
      />
      <View className='route-map-coverage'>
        <Text>资源覆盖县区 · {countyNames.length}</Text>
        <Text>{overviewMode ? mapScale < 8 ? '放大查看核心点位' : mapScale < 9 ? '核心点位模式' : '全部点位与名称' : countyNames.join('、')}</Text>
      </View>
      <View className='route-map-legend'>
        {overviewMode && <View className='route-map-legend-head'><Text>全部 {spots.length} 处点位</Text><Text>编号与地图一致</Text></View>}
        {legendSpots.map((spot, index) => (
          <View className='route-map-legend-item' key={spot.id} onClick={() => onSpotTap?.(spot)}><Text>{index + 1}</Text><Text>{spot.short}</Text></View>
        ))}
        {!overviewMode && spots.length > legendLimit && <Text className='route-map-more'>另有 {spots.length - legendLimit} 处点位，可在地图中缩放查看</Text>}
      </View>
    </View>
  )
}
