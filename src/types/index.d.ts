export type Role = "admin" | "dosen" | "mahasiswa" | "operator";
export type RoomStatus = "active" | "maintenance";
export type ReservationStatus = "pending" | "approved" | "rejected";
export type DayOfWeek = "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu" | "minggu";
export type AccessType = "contract" | "reservation" | "maintenance";
export type ActionType = 'door_opened' | 'door_held' | 'access_denied' | 'class_ended';

export interface User {
    id : number;
    identifier : string;
    email : string;
    nama : string;
    role : Role;
}

export interface Room {
    id : number;
    room_name : string;
    location : string;
    esp32_id : string;
    status : RoomStatus;
}

export interface Reservation {
    id : number;
    room_id : number;
    user_id : number;
    reservation_date : string;
    start_time : string;
    end_time : string;
    unique_code : string;
    status : ReservationStatus;
}

export interface Contract {
    id : number;
    room_id : number;
    dosen_id : nummber;
    ketua_kelas_id ?: number | null;
    day_of_week : DayOfWeek;
    start_time : string;
    end_time : string;
    unique_code : string;
}

export interface AccessLog {
  id: number;
  room_id: number;
  user_id: number;
  access_type: AccessType;
  action_type: ActionType;
  accessed_at: string;
}