type Animal = {
  id: string,
  transaction_id: string,
  animal_id: string,
  animal_status: string,
  calf_at_heel: string,
  capture_date_day: number,
  capture_date_year: number,
  capture_date_month: number,
  capture_utm_zone: number,
  capture_utm_easting: number,
  capture_utm_northing: number,
  ecotype: string,
  population_unit: string,
  ear_tag_left: string,
  ear_tag_right: string,
  life_stage: string,
  management_area: string,
  mortality_date: Date,
  mortality_utm_zone: number,
  mortality_utm_easting: number,
  mortality_utm_northing: number,
  project: string,
  re_capture: boolean,
  region: string,
  regional_contact: string,
  release_date: Date,
  sex: string,
  species: string,
  trans_location: boolean,
  wlh_id: string,
  nickname: string,
  // adding device_id for enabling bulk import of critters
  device_id: string,
}

enum eCritterFetchType {
  assigned = 'assigned',
  unassigned= 'unassigned',
  all = 'all'
}

export {
  eCritterFetchType,
  Animal,
}