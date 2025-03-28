export interface Navigator {
  bluetooth?: {
    requestDevice(options: {
      filters?: Array<{
        services?: (string | number)[];
        name?: string;
        namePrefix?: string;
      }>;
      acceptAllDevices?: boolean;
      optionalServices?: (string | number)[];
    }): Promise<BluetoothDevice>;
  };
}

export interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

export interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(
    service: string | number
  ): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristic(
    characteristic: string | number
  ): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: ArrayBuffer): Promise<void>;
  startNotifications(): Promise<void>;
  properties: {
    notify: boolean;
    read: boolean;
    write: boolean;
  };
}
