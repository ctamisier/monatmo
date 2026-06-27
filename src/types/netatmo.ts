export type NetatmoHome = {
  id: string
  name: string
  coordinates?: number[]
  altitude?: number
  rooms: NetatmoRoom[]
  modules: NetatmoModule[]
}

export type NetatmoRoom = {
  id: string
  name: string
  type: string
}

export type NetatmoModule = {
  id: string
  type: string
  name?: string
  room_id?: string
  bridge?: string
  battery_level?: number
  battery_state?: string
}

export type NetatmoHomeStatus = {
  id: string
  rooms: NetatmoRoomStatus[]
  modules: NetatmoModuleStatus[]
}

export type NetatmoRoomStatus = {
  id: string
  therm_measured_temperature?: number
  therm_setpoint_temperature?: number
  therm_setpoint_mode?: string
}

export type NetatmoModuleStatus = {
  id: string
  type: string
  firmware?: number
  battery_level?: number
  battery_state?: string
  target_position?: number
  current_position?: number
  position?: number
  on?: boolean
  'target_position:step'?: number
}

export type RoomMeasureValue = number | number[]

export type RoomMeasure = {
  beg_time: number
  step_time: number
  value?: RoomMeasureValue[]
  values?: Array<{ value?: number }>
}

export type RoomMeasureResponse = {
  body: RoomMeasure[] | { home: RoomMeasure } | RoomMeasure
}

export type HomesDataResponse = {
  body: {
    homes: NetatmoHome[]
  }
}

export type HomeStatusResponse = {
  body: {
    home: NetatmoHomeStatus
  }
}

export type SetStateResponse = {
  status: string
}

export type PublicDataMeasure = {
  res?: Record<string, number[]>
  type?: string[]
  rain_60min?: number
  rain_24h?: number
  rain_live?: number
  rain_timeutc?: number
  wind_strength?: number
  wind_angle?: number
  gust_strength?: number
  gust_angle?: number
  wind_timeutc?: number
}

export type PublicDataStation = {
  _id: string
  place: {
    timezone: string
    country: string
    altitude: number
    location: number[]
    city?: string
    street?: string
  }
  mark: number
  measures: Record<string, PublicDataMeasure>
  modules: string[]
  module_types: Record<string, string>
}

export type PublicDataResponse = {
  body: PublicDataStation[]
}
