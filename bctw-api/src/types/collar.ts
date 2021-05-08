type Collar = {
  collar_id: string;
  collar_transaction_id: string;
  camera_device_id: string;
  device_id: number;
  device_deployment_status: string;
  device_make: string;
  device_status;
  device_malfunction_type: string;
  device_model: string;
  device_type: string;
  dropoff_device_id: number;
  dropoff_frequency: number;
  dropoff_frequency_unit: number;
  frequency: number;
  fix_rate: number;
  fix_success_rate: number;
  frequency_unit: string;
  malfunction_date: Date;
  purchase_comment: string;
  purchase_month: number;
  purchase_year: number;
  retrieval_date: Date;
  retrieved: boolean;
  satellite_network: string;
  user_comment: string;
  vendor_activation_status: boolean;
}
interface ChangeCollarData {
  collar_id: string;
  animal_id: string;
  valid_from: Date | string;
  valid_to?: Date;
}
interface ChangeCritterCollarProps {
  isLink: boolean;
  data: ChangeCollarData;
}

export { ChangeCollarData, ChangeCritterCollarProps, Collar };
