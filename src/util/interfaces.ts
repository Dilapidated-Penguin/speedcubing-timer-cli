import { type } from "os";

export interface SolveInstance {
    time: number;
    scramble: string;
    label: string|null;
}
export interface sessionLog {
    entries: SolveInstance[];
    date: Date;
    date_formatted : string;
    event: string |null;
}
export interface file_data {
    data: Map<Date,sessionLog>;
    last_accessed_log: Date;
}
//######################
export interface session_statistics {
    session_mean:number;
    standard_deviation: number;
    variance: number;
    fastest_solve: number;
    slowest_solve: number;
}

export interface global_statistics {
    session_data: Map<Date,session_statistics>;
    pb_time: number | null;
    pb_Ao5:number | null;
    pb_Ao12:number | null;
}
export interface settings {
    scramble_length: number
}

export type event_types = 'pyraminx' | 'square1'|'megaminx' |'skewb'| number