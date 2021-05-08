type Animal = {
  critter_id: string;
  critter_transaction_id: string;
  animal_id: string;
  animal_status: string;
  associated_animal_id: string;
  associated_animal_relationship: string;
  capture_comment: string;
  capture_date: Date;
  capture_latitude: number;
  capture_longitude: number;
  capture_utm_easting: number;
  capture_utm_northing: number;
  capture_utm_zone: number;
  animal_colouration: string;
  ear_tag_id: string;
  ear_tag_left_colour: string;
  ear_tag_right_colour: string;
  estimated_age: number;
  juvenile_at_heel: string;
  life_stage: string;
  map_colour: string;
  mortality_comment: string;
  mortality_date: Date;
  mortality_latitude: number;
  mortality_longitude: number;
  mortality_utm_easting: number;
  mortality_utm_northing: number;
  mortality_utm_zone: number;
  probable_cause_of_death: string;
  ultimate_cause_of_death: string;
  population_unit: string;
  recapture: boolean;
  region: string;
  release_comment: string;
  release_date: Date;
  release_latitude: number;
  release_longitude: number;
  release_utm_easting: number;
  release_utm_northing: number;
  release_utm_zone: number;
  sex: string;
  species: string;
  translocation: boolean;
  wlh_id: string;
  user_comment: string;
}

enum eCritterFetchType {
  assigned = 'assigned',
  unassigned= 'unassigned'
}

export {
  eCritterFetchType,
  Animal,
}