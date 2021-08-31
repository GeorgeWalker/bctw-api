/**
 * represents the object the API receives from the frontend to
 * attach or unattach a device from an animal
 */

interface IAttachDeviceProps {
  collar_id: string;
  critter_id: string;
  valid_from: Date | string;
  valid_to?: Date | string;
}

interface IRemoveDeviceProps extends Pick<IAttachDeviceProps, 'valid_from' | 'valid_to'> {
  assignment_id: string;
}

interface IChangeDataLifeProps extends Pick<IRemoveDeviceProps, 'assignment_id'> {
  data_life_start: Date;
  data_life_end: Date;
}

export type { IAttachDeviceProps, IRemoveDeviceProps, IChangeDataLifeProps };
